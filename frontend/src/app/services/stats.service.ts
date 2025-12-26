import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { DashboardStats, DogViewStats } from '../models/features.model';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor() { }

  /**
   * Obtiene estadísticas del dashboard para rescatistas
   */
  async getRescuerStats(rescuerId: string): Promise<DashboardStats> {
    try {
      // Total de perros
      const { count: totalDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('rescuer_id', rescuerId);

      // Perros disponibles
      const { count: availableDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('rescuer_id', rescuerId)
        .eq('status', 'disponible');

      // Perros adoptados
      const { count: adoptedDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('rescuer_id', rescuerId)
        .eq('status', 'adoptado');

      // Solicitudes pendientes
      const { count: pendingRequests } = await supabase
        .from('adoption_requests')
        .select('*, dog:dogs!inner(*)', { count: 'exact', head: true })
        .eq('dog.rescuer_id', rescuerId)
        .eq('status', 'pendiente');

      // Solicitudes aprobadas este mes
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const { count: approvedThisMonth } = await supabase
        .from('adoption_requests')
        .select('*, dog:dogs!inner(*)', { count: 'exact', head: true })
        .eq('dog.rescuer_id', rescuerId)
        .eq('status', 'aprobada')
        .gte('updated_at', monthAgo.toISOString());

      // Citas pendientes
      const { count: upcomingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('rescuer_id', rescuerId)
        .eq('status', 'pendiente')
        .gte('appointment_date', new Date().toISOString());

      // Mensajes no leídos
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', rescuerId)
        .eq('is_read', false);

      // Reviews no aprobadas
      const { count: pendingReviews } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('rescuer_id', rescuerId)
        .eq('is_approved', false);

      return {
        total_dogs: totalDogs || 0,
        available_dogs: availableDogs || 0,
        adopted_dogs: adoptedDogs || 0,
        pending_requests: pendingRequests || 0,
        total_views: approvedThisMonth || 0,
        adoption_rate: upcomingAppointments || 0,
        average_days_to_adoption: unreadMessages || 0
      };
    } catch (error) {
      console.error('Error fetching rescuer stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del dashboard para adoptantes
   */
  async getAdopterStats(adopterId: string): Promise<Partial<DashboardStats>> {
    try {
      // Solicitudes pendientes
      const { count: pendingRequests } = await supabase
        .from('adoption_requests')
        .select('*', { count: 'exact', head: true })
        .eq('adopter_id', adopterId)
        .eq('status', 'pendiente');

      // Solicitudes aprobadas
      const { count: approvedRequests } = await supabase
        .from('adoption_requests')
        .select('*', { count: 'exact', head: true })
        .eq('adopter_id', adopterId)
        .eq('status', 'aprobada');

      // Favoritos
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', adopterId);

      // Citas próximas
      const { count: upcomingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('adopter_id', adopterId)
        .in('status', ['pendiente', 'confirmada'])
        .gte('appointment_date', new Date().toISOString());

      // Mensajes no leídos
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', adopterId)
        .eq('is_read', false);

      return {
        pending_requests: pendingRequests || 0,
        total_views: approvedRequests || 0,
        adoption_rate: upcomingAppointments || 0,
        average_days_to_adoption: unreadMessages || 0,
        total_dogs: favoritesCount || 0
      };
    } catch (error) {
      console.error('Error fetching adopter stats:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de visualizaciones de un perro
   */
  async getDogViews(dogId: string): Promise<DogViewStats> {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('name, view_count')
        .eq('id', dogId)
        .single();

      if (error) throw error;

      // Contar favoritos
      const { count: favoriteCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('dog_id', dogId);

      // Contar solicitudes
      const { count: requestCount } = await supabase
        .from('adoption_requests')
        .select('*', { count: 'exact', head: true })
        .eq('dog_id', dogId);

      return {
        dog_id: dogId,
        dog_name: data?.name || '',
        view_count: data?.view_count || 0,
        favorite_count: favoriteCount || 0,
        request_count: requestCount || 0
      };
    } catch (error) {
      console.error('Error fetching dog views:', error);
      throw error;
    }
  }

  /**
   * Incrementa el contador de visualizaciones de un perro
   */
  async incrementDogView(dogId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_dog_view', {
        dog_id: dogId
      });

      if (error) {
        // Si la función RPC no existe, hacer un UPDATE manual incrementando
        const { data: currentData } = await supabase
          .from('dogs')
          .select('view_count')
          .eq('id', dogId)
          .single();
        
        if (currentData) {
          await supabase
            .from('dogs')
            .update({ view_count: (currentData.view_count || 0) + 1 })
            .eq('id', dogId);
        }
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // No lanzar error, es una operación no crítica
    }
  }

  /**
   * Obtiene datos para gráfico de adopciones por mes
   */
  async getAdoptionsByMonth(rescuerId: string, months: number = 12): Promise<{ month: string; count: number }[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from('adoption_requests')
        .select('created_at, dog:dogs!inner(rescuer_id)')
        .eq('dog.rescuer_id', rescuerId)
        .eq('status', 'aprobada')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por mes
      const monthCounts = new Map<string, number>();
      data?.forEach((item: any) => {
        const date = new Date(item.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
      });

      return Array.from(monthCounts.entries()).map(([month, count]) => ({
        month,
        count
      }));
    } catch (error) {
      console.error('Error fetching adoptions by month:', error);
      throw error;
    }
  }

  /**
   * Obtiene distribución de perros por tamaño
   */
  async getDogsBySizeDistribution(rescuerId: string): Promise<{ size: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('size')
        .eq('rescuer_id', rescuerId);

      if (error) throw error;

      const sizeCounts = new Map<string, number>();
      data?.forEach((dog: any) => {
        const size = dog.size || 'Sin especificar';
        sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1);
      });

      return Array.from(sizeCounts.entries()).map(([size, count]) => ({
        size,
        count
      }));
    } catch (error) {
      console.error('Error fetching dogs by size:', error);
      throw error;
    }
  }

  /**
   * Obtiene perros más populares (por vistas y favoritos)
   */
  async getTopDogs(rescuerId: string, limit: number = 5): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          favorites:favorites(count)
        `)
        .eq('rescuer_id', rescuerId)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching top dogs:', error);
      throw error;
    }
  }
}
