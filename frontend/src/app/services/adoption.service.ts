import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AdoptionRequest, CreateAdoptionRequestDto, UpdateAdoptionRequestDto } from '../models/adoption.model';

@Injectable({
  providedIn: 'root'
})
export class AdoptionService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async createAdoptionRequest(request: CreateAdoptionRequestDto, adopterId: string) {
    // Obtener el rescuer_id del perro
    const { data: dog } = await this.supabase
      .from('dogs')
      .select('rescuer_id')
      .eq('id', request.dog_id)
      .single();

    if (!dog) throw new Error('Perro no encontrado');

    const { data, error } = await this.supabase
      .from('adoption_requests')
      .insert({
        ...request,
        adopter_id: adopterId,
        rescuer_id: dog.rescuer_id
      })
      .select()
      .single();

    if (error) throw error;
    return data as AdoptionRequest;
  }

  async getMyAdoptionRequests(userId: string) {
    const { data, error } = await this.supabase
      .from('adoption_requests')
      .select(`
        *,
        dog:dogs(*),
        rescuer:user_profiles!rescuer_id(first_name, last_name, organization_name, email, phone)
      `)
      .eq('adopter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AdoptionRequest[];
  }

  async getAdoptionRequestsForMyDogs(rescuerId: string) {
    const { data, error } = await this.supabase
      .from('adoption_requests')
      .select(`
        *,
        dog:dogs(*),
        adopter:user_profiles!adoption_requests_adopter_id_fkey(*)
      `)
      .eq('rescuer_id', rescuerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error en getAdoptionRequestsForMyDogs:', error);
      throw error;
    }

    return data as AdoptionRequest[];
  }

  async updateAdoptionRequest(id: string, updates: UpdateAdoptionRequestDto) {
    // Primero hacer el update
    const { error: updateError } = await this.supabase
      .from('adoption_requests')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;
    
    // Si se aprueba o completa, actualizar el estado del perro
    if (updates.status === 'aprobada' || updates.status === 'completada') {
      // Obtener el dog_id de la solicitud
      const { data: request, error: fetchError } = await this.supabase
        .from('adoption_requests')
        .select('dog_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (updates.status === 'aprobada') {
        await this.supabase
          .from('dogs')
          .update({ status: 'en_proceso' })
          .eq('id', request.dog_id);
      } else if (updates.status === 'completada') {
        await this.supabase
          .from('dogs')
          .update({ status: 'adoptado' })
          .eq('id', request.dog_id);
      }
    }

    // Obtener el registro actualizado completo
    const { data, error } = await this.supabase
      .from('adoption_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AdoptionRequest;
  }

  async getAdoptionRequestById(id: string) {
    const { data, error } = await this.supabase
      .from('adoption_requests')
      .select(`
        *,
        dog:dogs(*),
        adopter:user_profiles!adopter_id(*),
        rescuer:user_profiles!rescuer_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AdoptionRequest;
  }

  async updateAdoptionStatus(id: string, status: 'pendiente' | 'aprobada' | 'rechazada' | 'completada', notes?: string) {
    const updates: any = { status };
    if (notes) {
      updates.notes = notes;
    }
    return this.updateAdoptionRequest(id, updates);
  }

  async checkExistingRequest(dogId: string, adopterId: string): Promise<AdoptionRequest | null> {
    const { data, error } = await this.supabase
      .from('adoption_requests')
      .select('*')
      .eq('dog_id', dogId)
      .eq('adopter_id', adopterId)
      .maybeSingle();

    if (error) throw error;
    return data as AdoptionRequest | null;
  }

  async cancelAdoptionRequest(requestId: string, cancellationReason?: string) {

    // 1. Obtener la solicitud con el dog_id
    const { data: request, error: fetchError } = await this.supabase
      .from('adoption_requests')
      .select('dog_id, created_at')
      .eq('id', requestId)
      .single();
    
    if (fetchError) {
      console.error('Error obteniendo solicitud:', fetchError);
      throw fetchError;
    }

    // 2. Actualizar la solicitud a 'cancelada_por_adoptante'
    const { data: updateData, error: updateError } = await this.supabase
      .from('adoption_requests')
      .update({
        status: 'cancelada_por_adoptante',
        cancellation_reason: cancellationReason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select();
    
    if (updateError) {
      console.error('Error actualizando solicitud:', updateError);
      throw updateError;
    }


    // 3. Actualizar el perro a 'disponible'
    const { error: dogError } = await this.supabase
      .from('dogs')
      .update({ status: 'disponible' })
      .eq('id', request.dog_id);
    
    if (dogError) {
      console.error('Error actualizando perro:', dogError);
      throw dogError;
    }

    return { success: true };
  }

  async checkCooldownPeriod(dogId: string, adopterId: string): Promise<{ isInCooldown: boolean; daysRemaining?: number }> {
    const { data, error } = await this.supabase
      .from('adoption_requests')
      .select('cancelled_at')
      .eq('dog_id', dogId)
      .eq('adopter_id', adopterId)
      .eq('status', 'cancelada_por_adoptante')
      .order('cancelled_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data || !data.cancelled_at) {
      return { isInCooldown: false };
    }
    
    const cancelledDate = new Date(data.cancelled_at);
    const now = new Date();
    const daysSinceCancellation = Math.floor((now.getTime() - cancelledDate.getTime()) / (1000 * 60 * 60 * 24));
    const cooldownDays = 7;
    
    if (daysSinceCancellation < cooldownDays) {
      return {
        isInCooldown: true,
        daysRemaining: cooldownDays - daysSinceCancellation
      };
    }
    
    return { isInCooldown: false };
  }
}
