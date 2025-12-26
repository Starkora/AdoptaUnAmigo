export type AdoptionStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'completada' | 'cancelada_por_adoptante';

export interface AdoptionRequest {
  id: string;
  dog_id: string;
  adopter_id: string;
  rescuer_id: string;
  status: AdoptionStatus;
  message?: string;
  response_message?: string;
  has_experience: boolean;
  has_other_pets: boolean;
  has_yard: boolean;
  reason_for_adoption?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // Relaciones expandidas (opcional)
  dog?: any;
  adopter?: any;
  rescuer?: any;
}

export interface CreateAdoptionRequestDto {
  dog_id: string;
  message?: string;
  has_experience: boolean;
  has_other_pets: boolean;
  has_yard: boolean;
  reason_for_adoption?: string;
}

export interface UpdateAdoptionRequestDto {
  status: AdoptionStatus;
  response_message?: string;
}
