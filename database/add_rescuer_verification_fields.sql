-- Agregar campos de verificación para rescatistas
-- Ejecutar en Supabase SQL Editor

-- Crear ENUM para tipo de rescatista
DO $$ BEGIN
    CREATE TYPE rescuer_type_enum AS ENUM ('individual', 'organizacion', 'albergue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas a user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS rescuer_type rescuer_type_enum,
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS rescue_address TEXT,
ADD COLUMN IF NOT EXISTS attention_hours TEXT,
ADD COLUMN IF NOT EXISTS social_networks JSONB,
ADD COLUMN IF NOT EXISTS followup_process TEXT,
ADD COLUMN IF NOT EXISTS place_photo_url TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN user_profiles.rescuer_type IS 'Tipo de rescatista: individual, organización o albergue';
COMMENT ON COLUMN user_profiles.years_experience IS 'Años de experiencia como rescatista';
COMMENT ON COLUMN user_profiles.rescue_address IS 'Dirección física donde se encuentran los animales';
COMMENT ON COLUMN user_profiles.attention_hours IS 'Horario de atención para visitas (solo albergue/organización)';
COMMENT ON COLUMN user_profiles.social_networks IS 'Redes sociales del rescatista/organización (JSON: {facebook, instagram, website})';
COMMENT ON COLUMN user_profiles.followup_process IS 'Descripción del proceso de seguimiento post-adopción';
COMMENT ON COLUMN user_profiles.place_photo_url IS 'URL de la foto del lugar donde se cuidan los animales';
