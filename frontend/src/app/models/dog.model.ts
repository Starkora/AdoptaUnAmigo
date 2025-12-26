export type DogSize = 'pequeño' | 'mediano' | 'grande';
export type DogGender = 'macho' | 'hembra';
export type DogStatus = 'disponible' | 'en_proceso' | 'adoptado';
export type EnergyLevel = 'bajo' | 'medio' | 'alto';
export type ExperienceRequired = 'ninguna' | 'basica' | 'intermedia' | 'avanzada';
export type UrgencyLevel = 'normal' | 'alto' | 'urgente';

export interface Dog {
  id: string;
  name: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  size: DogSize;
  gender: DogGender;
  description: string;
  medical_history?: string;
  is_vaccinated: boolean;
  is_sterilized: boolean;
  status: DogStatus;
  main_image_url?: string;
  images: string[];
  rescuer_id: string;
  location?: string;
  created_at: string;
  updated_at: string;
  rescuer?: {
    first_name: string;
    last_name: string;
    organization_name?: string;
    rescuer_type?: 'individual' | 'organizacion' | 'albergue';
    rating_average?: number;
    is_verified?: boolean;
  };
  // Nuevos campos para funcionalidades
  energy_level?: EnergyLevel;
  good_with_kids?: boolean;
  good_with_dogs?: boolean;
  good_with_cats?: boolean;
  special_needs?: string;
  experience_required?: ExperienceRequired;
  urgency_level?: UrgencyLevel;
  days_in_shelter?: number;
  video_url?: string;
  view_count?: number;
}

export interface CreateDogDto {
  name: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  size: DogSize;
  gender: DogGender;
  description: string;
  medical_history?: string;
  is_vaccinated: boolean;
  is_sterilized: boolean;
  main_image_url?: string;
  images?: string[];
  location?: string;
  energy_level?: EnergyLevel;
  good_with_kids?: boolean | null;
  good_with_dogs?: boolean | null;
  good_with_cats?: boolean | null;
  special_needs?: string;
  experience_required?: ExperienceRequired;
  urgency_level?: UrgencyLevel;
  video_url?: string;
}

export interface UpdateDogDto {
  name?: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  size?: DogSize;
  gender?: DogGender;
  description?: string;
  medical_history?: string;
  is_vaccinated?: boolean;
  is_sterilized?: boolean;
  main_image_url?: string;
  images?: string[];
  location?: string;
  status?: DogStatus;
}
