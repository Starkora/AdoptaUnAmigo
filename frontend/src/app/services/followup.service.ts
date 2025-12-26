import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AdoptionFollowup } from '../models/features.model';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})
export class FollowupService {

  constructor() { }

  /**
   * Obtiene los seguimientos de una solicitud de adopción
   */
  async getFollowupsByAdoptionRequest(adoptionRequestId: string): Promise<AdoptionFollowup[]> {
    const { data, error } = await supabase
      .from('adoption_followups')
      .select('*, adoption_request:adoption_requests(*)')
      .eq('adoption_request_id', adoptionRequestId)
      .order('followup_date', { ascending: false });

    if (error) {
      console.error('Error fetching followups:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtiene todos los seguimientos pendientes del usuario
   */
  async getPendingFollowups(userId: string, isRescuer: boolean = false): Promise<AdoptionFollowup[]> {
    let query = supabase
      .from('adoption_followups')
      .select(`
        *,
        adoption_request:adoption_requests(
          *,
          adopter:user_profiles!adoption_requests_adopter_id_fkey(*),
          dog:dogs(*, rescuer:user_profiles(*))
        )
      `)
      .eq('status', 'pendiente')
      .order('followup_date', { ascending: true });

    // Si es rescatista, filtrar por perros del rescatista
    // Si es adoptante, filtrar por sus adopciones
    if (isRescuer) {
      query = query.eq('adoption_request.dog.rescuer_id', userId);
    } else {
      query = query.eq('adoption_request.adopter_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pending followups:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Crea un nuevo seguimiento
   */
  async createFollowup(
    adoptionRequestId: string,
    followupDate: Date
  ): Promise<AdoptionFollowup> {
    const { data, error } = await supabase
      .from('adoption_followups')
      .insert({
        adoption_request_id: adoptionRequestId,
        followup_date: followupDate.toISOString(),
        status: 'pendiente'
      })
      .select('*, adoption_request:adoption_requests(*)')
      .single();

    if (error) {
      console.error('Error creating followup:', error);
      throw error;
    }

    return data;
  }

  /**
   * Actualiza un seguimiento
   */
  async updateFollowup(
    id: string,
    updates: {
      dog_health?: string;
      dog_behavior?: string;
      adopter_satisfaction?: number;
      photos?: string[];
      notes?: string;
      status?: 'pendiente' | 'completado';
    }
  ): Promise<AdoptionFollowup> {
    const { data, error } = await supabase
      .from('adoption_followups')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, adoption_request:adoption_requests(*)')
      .single();

    if (error) {
      console.error('Error updating followup:', error);
      throw error;
    }

    return data;
  }

  /**
   * Completa un seguimiento
   */
  async completeFollowup(
    id: string,
    dogHealth: string,
    dogBehavior: string,
    satisfaction: number,
    photos: string[] = [],
    notes?: string
  ): Promise<AdoptionFollowup> {
    return this.updateFollowup(id, {
      dog_health: dogHealth,
      dog_behavior: dogBehavior,
      adopter_satisfaction: satisfaction,
      photos,
      notes,
      status: 'completado'
    });
  }

  /**
   * Programa seguimientos automáticos (7, 30, 90 días después de adopción)
   */
  async scheduleFollowups(adoptionRequestId: string, adoptionDate: Date): Promise<void> {
    const followupDays = [7, 30, 90];
    
    const followups = followupDays.map(days => {
      const followupDate = new Date(adoptionDate);
      followupDate.setDate(followupDate.getDate() + days);
      
      return {
        adoption_request_id: adoptionRequestId,
        followup_date: followupDate.toISOString(),
        status: 'pendiente' as const
      };
    });

    const { error } = await supabase
      .from('adoption_followups')
      .insert(followups);

    if (error) {
      console.error('Error scheduling followups:', error);
      throw error;
    }
  }

  /**
   * Elimina un seguimiento
   */
  async deleteFollowup(id: string): Promise<void> {
    const { error } = await supabase
      .from('adoption_followups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting followup:', error);
      throw error;
    }
  }

  /**
   * Sube fotos del seguimiento a Supabase Storage
   */
  async uploadFollowupPhotos(followupId: string, files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${followupId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `followup-photos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('dogs')
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading photo:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('dogs')
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  }
}
