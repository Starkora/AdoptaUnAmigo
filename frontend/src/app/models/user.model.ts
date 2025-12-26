export type UserRole = 'adoptante' | 'rescatista';
export type HomeType = 'casa' | 'departamento' | 'quinta' | 'otro';
export type EconomicStatus = 'estable' | 'inestable' | 'en_desarrollo';
export type RescuerType = 'individual' | 'organizacion' | 'albergue';

export interface SocialNetworks {
  facebook?: string;
  instagram?: string;
  website?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role: UserRole;
  organization_name?: string; // Solo para rescatistas
  description?: string;
  avatar_url?: string;
  
  // Campos de verificación para adoptantes
  country?: string;
  province?: string;
  district?: string;
  dni?: string;
  birth_date?: string;
  occupation?: string;
  home_type?: HomeType;
  has_yard?: boolean;
  household_members?: number;
  has_pets?: boolean;
  pet_experience?: string;
  why_adopt?: string;
  availability_hours?: string;
  economic_status?: EconomicStatus;
  
  // Campos de verificación para rescatistas
  rescuer_type?: RescuerType;
  years_experience?: number;
  rescue_address?: string;
  attention_hours?: string;
  social_networks?: SocialNetworks;
  followup_process?: string;
  place_photo_url?: string;
  
  // Verificación de identidad
  is_verified?: boolean;
  dni_document_url?: string;
  verification_date?: string;
  
  // Rating y reviews
  rating_average?: number;
  rating_count?: number;
  
  // Geolocalización
  latitude?: number;
  longitude?: number;
  
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}
