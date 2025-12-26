// =============================================
// MODELOS PARA NUEVAS FUNCIONALIDADES
// =============================================

// Mensajería
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  dog_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  receiver?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  dog?: {
    name: string;
    main_image_url?: string;
  };
}

export interface Conversation {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  last_message: string;
  last_message_date: string;
  unread_count: number;
  dog_id?: string;
  dog_name?: string;
}

// Favoritos
export interface Favorite {
  id: string;
  user_id: string;
  dog_id: string;
  created_at: string;
  dog?: {
    name: string;
    breed?: string;
    main_image_url?: string;
    status: string;
  };
}

// Citas
export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export interface Appointment {
  id: string;
  adopter_id: string;
  rescuer_id: string;
  dog_id: string;
  appointment_date: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  adopter?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  rescuer?: {
    first_name: string;
    last_name: string;
    organization_name?: string;
  };
  dog?: {
    name: string;
    main_image_url?: string;
  };
}

export interface CreateAppointmentDto {
  rescuer_id: string;
  dog_id: string;
  appointment_date: string;
  notes?: string;
}

// Reviews y Testimonios
export interface Review {
  id: string;
  reviewer_id: string;
  rescuer_id: string;
  dog_id?: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  reviewer?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  dog?: {
    name: string;
    main_image_url?: string;
  };
}

export interface CreateReviewDto {
  rescuer_id: string;
  dog_id?: string;
  rating: number;
  comment?: string;
}

// Seguimiento Post-Adopción
export type FollowupStatus = 'pendiente' | 'completado';

export interface AdoptionFollowup {
  id: string;
  adoption_request_id: string;
  followup_date: string;
  status: FollowupStatus;
  dog_health?: string;
  dog_behavior?: string;
  adopter_satisfaction?: number;
  photos?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFollowupDto {
  adoption_request_id: string;
  dog_health: string;
  dog_behavior: string;
  adopter_satisfaction: number;
  photos?: string[];
  notes?: string;
}

// Preferencias de Notificaciones
export interface NotificationPreferences {
  id: string;
  user_id: string;
  new_dogs: boolean;
  messages: boolean;
  appointments: boolean;
  adoption_status: boolean;
  followups: boolean;
  favorites_updates: boolean;
  push_token?: string;
  created_at: string;
  updated_at: string;
}

// Estadísticas
export interface DashboardStats {
  total_dogs: number;
  available_dogs: number;
  adopted_dogs: number;
  pending_requests: number;
  total_views: number;
  adoption_rate: number;
  average_days_to_adoption: number;
}

export interface DogViewStats {
  dog_id: string;
  dog_name: string;
  view_count: number;
  favorite_count: number;
  request_count: number;
}

// Logs de Auditoría
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
