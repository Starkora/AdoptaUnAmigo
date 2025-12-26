-- =============================================
-- Agregar campos de verificación para adoptantes
-- =============================================

-- Agregar nuevos campos a la tabla user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS home_type TEXT, -- 'casa' | 'departamento' | 'otro'
ADD COLUMN IF NOT EXISTS has_yard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS household_members INTEGER,
ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pet_experience TEXT,
ADD COLUMN IF NOT EXISTS why_adopt TEXT,
ADD COLUMN IF NOT EXISTS availability_hours TEXT,
ADD COLUMN IF NOT EXISTS economic_status TEXT; -- 'estable' | 'variable' | 'independiente'

-- Crear índice para búsquedas por DNI (único para evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_dni ON user_profiles(dni) WHERE dni IS NOT NULL;

-- Crear índice para búsquedas por país y provincia
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(country, province, district);

-- Comentarios para documentación
COMMENT ON COLUMN user_profiles.country IS 'País de residencia del usuario';
COMMENT ON COLUMN user_profiles.province IS 'Provincia/Estado de residencia';
COMMENT ON COLUMN user_profiles.district IS 'Distrito/Ciudad de residencia';
COMMENT ON COLUMN user_profiles.dni IS 'Documento Nacional de Identidad';
COMMENT ON COLUMN user_profiles.birth_date IS 'Fecha de nacimiento';
COMMENT ON COLUMN user_profiles.occupation IS 'Ocupación laboral del adoptante';
COMMENT ON COLUMN user_profiles.home_type IS 'Tipo de vivienda: casa, departamento, otro';
COMMENT ON COLUMN user_profiles.has_yard IS 'Indica si tiene patio o jardín';
COMMENT ON COLUMN user_profiles.household_members IS 'Número de personas en el hogar';
COMMENT ON COLUMN user_profiles.has_pets IS 'Indica si tiene otras mascotas';
COMMENT ON COLUMN user_profiles.pet_experience IS 'Experiencia previa con mascotas';
COMMENT ON COLUMN user_profiles.why_adopt IS 'Razón por la cual desea adoptar';
COMMENT ON COLUMN user_profiles.availability_hours IS 'Horas disponibles para cuidar la mascota';
COMMENT ON COLUMN user_profiles.economic_status IS 'Situación económica: estable, variable, independiente';
