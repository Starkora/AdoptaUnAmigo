import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Dog, CreateDogDto, UpdateDogDto, DogStatus } from '../models/dog.model';

@Injectable({
  providedIn: 'root'
})
export class DogService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getAllDogs(filters?: { status?: DogStatus; size?: string; gender?: string }) {
    let query = this.supabase
      .from('dogs')
      .select('*, rescuer:user_profiles!rescuer_id(first_name, last_name, organization_name, rescuer_type)')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.size) {
      query = query.eq('size', filters.size);
    }
    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }

    const { data, error } = await query;


    if (error) throw error;
    return data as Dog[];
  }

  async getDogById(id: string) {
    const { data, error } = await this.supabase
      .from('dogs')
      .select('*, rescuer:user_profiles!rescuer_id(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Dog;
  }

  async getMyDogs(userId: string) {
    const { data, error } = await this.supabase
      .from('dogs')
      .select('*')
      .eq('rescuer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Dog[];
  }

  async createDog(dog: CreateDogDto, rescuerId: string) {
    const { data, error } = await this.supabase
      .from('dogs')
      .insert({
        ...dog,
        rescuer_id: rescuerId
      })
      .select()
      .single();

    if (error) throw error;
    return data as Dog;
  }

  async updateDog(id: string, updates: Partial<CreateDogDto> & { status?: DogStatus }) {
    const { data, error } = await this.supabase
      .from('dogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Dog;
  }

  async deleteDog(id: string) {
    const { error } = await this.supabase
      .from('dogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateDogStatus(id: string, status: DogStatus) {
    return this.updateDog(id, { status } as any);
  }

  async searchDogs(searchTerm: string) {
    const { data, error } = await this.supabase
      .from('dogs')
      .select('*, rescuer:user_profiles!rescuer_id(first_name, last_name, organization_name, rescuer_type)')
      .or(`name.ilike.%${searchTerm}%,breed.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .eq('status', 'disponible');

    if (error) throw error;
    return data as Dog[];
  }
}
