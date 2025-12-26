import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { NotificationPreferences } from '../models/features.model';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  /**
   * Obtiene las preferencias de notificaciones del usuario
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No existe, crear preferencias por defecto
        return this.createDefaultPreferences(userId);
      }
      console.error('Error fetching notification preferences:', error);
      throw error;
    }

    return data;
  }

  /**
   * Crea preferencias por defecto para un usuario
   */
  async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        new_dogs: true,
        messages: true,
        appointments: true,
        adoption_status: true,
        followups: true,
        favorites_updates: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }

    return data;
  }

  /**
   * Actualiza las preferencias de notificaciones
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }

    return data;
  }

  /**
   * Guarda el token de push notifications
   */
  async savePushToken(userId: string, pushToken: string): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .update({
        push_token: pushToken,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  }

  /**
   * Elimina el token de push notifications (logout)
   */
  async removePushToken(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .update({
        push_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing push token:', error);
      throw error;
    }
  }

  /**
   * Verifica si el usuario tiene habilitada una notificación específica
   */
  async isNotificationEnabled(userId: string, notificationType: keyof NotificationPreferences): Promise<boolean> {
    const preferences = await this.getPreferences(userId);
    if (!preferences) return true; // Por defecto todas activadas
    
    return preferences[notificationType] as boolean ?? true;
  }

  /**
   * Envía notificación en la app (mock - implementar con toast o snackbar)
   */
  showInAppNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // Implementar con tu librería de toasts preferida
    
    // Ejemplo con Toastr (si lo tienes instalado):
    // switch(type) {
    //   case 'success': this.toastr.success(message, title); break;
    //   case 'error': this.toastr.error(message, title); break;
    //   case 'warning': this.toastr.warning(message, title); break;
    //   default: this.toastr.info(message, title);
    // }
  }

  /**
   * Registra un log en la base de datos para notificaciones enviadas
   * (útil para tracking y debugging)
   */
  async logNotification(
    userId: string,
    notificationType: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'notification_sent',
          table_name: 'notification_preferences',
          new_data: {
            type: notificationType,
            title,
            message,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      // No bloquear si falla el log
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Envía notificación cuando hay un nuevo perro disponible
   */
  async notifyNewDog(dogName: string, dogBreed: string, rescuerName: string): Promise<void> {
    // Obtener usuarios con notificaciones de nuevos perros activadas
    const { data: users } = await supabase
      .from('notification_preferences')
      .select('user_id, push_token')
      .eq('new_dogs', true);

    if (!users || users.length === 0) return;

    const title = '¡Nuevo perro disponible!';
    const message = `${dogName} (${dogBreed}) está disponible para adopción con ${rescuerName}`;

    // Aquí implementarías el envío real de push notifications
    // Por ahora solo logueamos
    for (const user of users) {
      await this.logNotification(user.user_id, 'new_dog', title, message);
    }
  }

  /**
   * Notifica cuando hay un nuevo mensaje
   */
  async notifyNewMessage(receiverId: string, senderName: string, preview: string): Promise<void> {
    const enabled = await this.isNotificationEnabled(receiverId, 'messages');
    if (!enabled) return;

    const title = `Nuevo mensaje de ${senderName}`;
    const message = preview.substring(0, 100);

    this.showInAppNotification(title, message, 'info');
    await this.logNotification(receiverId, 'new_message', title, message);
  }

  /**
   * Notifica cambio de estado en solicitud de adopción
   */
  async notifyAdoptionStatusChange(
    adopterId: string,
    dogName: string,
    newStatus: string
  ): Promise<void> {
    const enabled = await this.isNotificationEnabled(adopterId, 'adoption_status');
    if (!enabled) return;

    const statusMessages: Record<string, string> = {
      'aprobada': `¡Tu solicitud para adoptar a ${dogName} ha sido aprobada!`,
      'rechazada': `Tu solicitud para adoptar a ${dogName} ha sido revisada`,
      'en_revision': `Tu solicitud para adoptar a ${dogName} está en revisión`
    };

    const message = statusMessages[newStatus] || `Actualización sobre tu solicitud para ${dogName}`;
    const title = 'Actualización de adopción';

    this.showInAppNotification(title, message, newStatus === 'aprobada' ? 'success' : 'info');
    await this.logNotification(adopterId, 'adoption_status_change', title, message);
  }

  /**
   * Notifica recordatorio de cita próxima
   */
  async notifyUpcomingAppointment(
    userId: string,
    dogName: string,
    appointmentDate: Date
  ): Promise<void> {
    const enabled = await this.isNotificationEnabled(userId, 'appointments');
    if (!enabled) return;

    const dateStr = appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const title = 'Recordatorio de cita';
    const message = `Tienes una cita programada para visitar a ${dogName} el ${dateStr}`;

    this.showInAppNotification(title, message, 'warning');
    await this.logNotification(userId, 'appointment_reminder', title, message);
  }

  /**
   * Notifica seguimiento pendiente
   */
  async notifyPendingFollowup(
    adopterId: string,
    dogName: string
  ): Promise<void> {
    const enabled = await this.isNotificationEnabled(adopterId, 'followups');
    if (!enabled) return;

    const title = 'Seguimiento pendiente';
    const message = `Es momento de completar el seguimiento de ${dogName}. ¡Cuéntanos cómo va todo!`;

    this.showInAppNotification(title, message, 'info');
    await this.logNotification(adopterId, 'followup_reminder', title, message);
  }

  /**
   * Notifica cuando un perro favorito es adoptado
   */
  async notifyFavoriteDogAdopted(
    userId: string,
    dogName: string
  ): Promise<void> {
    const enabled = await this.isNotificationEnabled(userId, 'favorites_updates');
    if (!enabled) return;

    const title = 'Actualización de favorito';
    const message = `${dogName}, uno de tus perros favoritos, ha sido adoptado`;

    this.showInAppNotification(title, message, 'info');
    await this.logNotification(userId, 'favorite_adopted', title, message);
  }
}
