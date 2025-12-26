-- =============================================
-- Crear función para crear perfil completo
-- Esta función bypasea RLS usando SECURITY DEFINER
-- =============================================

-- Eliminar función si existe
DROP FUNCTION IF EXISTS public.create_complete_user_profile(uuid, jsonb);

-- Crear función con privilegios elevados
CREATE OR REPLACE FUNCTION public.create_complete_user_profile(
  user_id UUID,
  profile_data JSONB
)
RETURNS SETOF user_profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del creador (postgres)
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    phone,
    country,
    province,
    district,
    address,
    dni,
    birth_date,
    occupation,
    home_type,
    has_yard,
    household_members,
    has_pets,
    pet_experience,
    why_adopt,
    availability_hours,
    economic_status,
    organization_name,
    rescuer_type,
    years_experience,
    rescue_address,
    attention_hours,
    social_networks,
    followup_process,
    place_photo_url
  )
  VALUES (
    user_id,
    profile_data->>'email',
    profile_data->>'first_name',
    profile_data->>'last_name',
    (profile_data->>'role')::user_role_type,
    profile_data->>'phone',
    profile_data->>'country',
    profile_data->>'province',
    profile_data->>'district',
    profile_data->>'address',
    profile_data->>'dni',
    (profile_data->>'birth_date')::date,
    profile_data->>'occupation',
    (profile_data->>'home_type')::home_type_enum,
    (profile_data->>'has_yard')::boolean,
    (profile_data->>'household_members')::integer,
    (profile_data->>'has_pets')::boolean,
    profile_data->>'pet_experience',
    profile_data->>'why_adopt',
    profile_data->>'availability_hours',
    (profile_data->>'economic_status')::economic_status_enum,
    profile_data->>'organization_name',
    (profile_data->>'rescuer_type')::rescuer_type_enum,
    (profile_data->>'years_experience')::integer,
    profile_data->>'rescue_address',
    profile_data->>'attention_hours',
    (profile_data->>'social_networks')::jsonb,
    profile_data->>'followup_process',
    profile_data->>'place_photo_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    country = EXCLUDED.country,
    province = EXCLUDED.province,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    dni = EXCLUDED.dni,
    birth_date = EXCLUDED.birth_date,
    occupation = EXCLUDED.occupation,
    home_type = EXCLUDED.home_type,
    has_yard = EXCLUDED.has_yard,
    household_members = EXCLUDED.household_members,
    has_pets = EXCLUDED.has_pets,
    pet_experience = EXCLUDED.pet_experience,
    why_adopt = EXCLUDED.why_adopt,
    availability_hours = EXCLUDED.availability_hours,
    economic_status = EXCLUDED.economic_status,
    organization_name = EXCLUDED.organization_name,
    rescuer_type = EXCLUDED.rescuer_type,
    years_experience = EXCLUDED.years_experience,
    rescue_address = EXCLUDED.rescue_address,
    attention_hours = EXCLUDED.attention_hours,
    social_networks = EXCLUDED.social_networks,
    followup_process = EXCLUDED.followup_process,
    place_photo_url = EXCLUDED.place_photo_url,
    updated_at = NOW()
  RETURNING *;
END;
$$;

-- Otorgar permisos a todos los roles
GRANT EXECUTE ON FUNCTION public.create_complete_user_profile(uuid, jsonb) 
TO postgres, anon, authenticated, service_role;

-- Verificar que se creó
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_complete_user_profile';
