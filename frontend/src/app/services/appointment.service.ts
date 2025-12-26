import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Appointment, CreateAppointmentDto, AppointmentStatus } from '../models/features.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getMyAppointments(userId: string, asRescuer: boolean = false): Promise<Appointment[]> {
    const field = asRescuer ? 'rescuer_id' : 'adopter_id';
    
    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        adopter:user_profiles!adopter_id(first_name, last_name, phone),
        rescuer:user_profiles!rescuer_id(first_name, last_name, organization_name),
        dog:dogs(name, main_image_url)
      `)
      .eq(field, userId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  }

  async createAppointment(adopterId: string, dto: CreateAppointmentDto): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from('appointments')
      .insert({
        adopter_id: adopterId,
        ...dto
      })
      .select(`
        *,
        adopter:user_profiles!adopter_id(first_name, last_name, phone),
        rescuer:user_profiles!rescuer_id(first_name, last_name, organization_name),
        dog:dogs(name, main_image_url)
      `)
      .single();

    if (error) throw error;
    return data as Appointment;
  }

  async updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
    const { error } = await this.supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId);

    if (error) throw error;
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    await this.updateAppointmentStatus(appointmentId, 'cancelada');
  }

  async confirmAppointment(appointmentId: string): Promise<void> {
    await this.updateAppointmentStatus(appointmentId, 'confirmada');
  }

  async completeAppointment(appointmentId: string): Promise<void> {
    await this.updateAppointmentStatus(appointmentId, 'completada');
  }

  async getUpcomingAppointments(userId: string, asRescuer: boolean = false): Promise<Appointment[]> {
    const field = asRescuer ? 'rescuer_id' : 'adopter_id';
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('appointments')
      .select(`
        *,
        adopter:user_profiles!adopter_id(first_name, last_name, phone),
        rescuer:user_profiles!rescuer_id(first_name, last_name, organization_name),
        dog:dogs(name, main_image_url)
      `)
      .eq(field, userId)
      .gte('appointment_date', now)
      .in('status', ['pendiente', 'confirmada'])
      .order('appointment_date', { ascending: true })
      .limit(5);

    if (error) throw error;
    return data as Appointment[];
  }
}
