-- =============================================
-- Agregar columnas de verificación para adoptantes
-- Estas columnas almacenan la información detallada
-- requerida en el formulario de registro de 3 pasos
-- =============================================

-- Tipos ENUM necesarios
DO $$ BEGIN
    CREATE TYPE home_type_enum AS ENUM ('casa', 'departamento', 'quinta', 'otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE economic_status_enum AS ENUM ('estable', 'inestable', 'en_desarrollo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columnas de ubicación
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Perú',
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS district TEXT;

-- Agregar columnas de información personal
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS occupation TEXT;

-- Agregar columnas de información de vivienda
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS home_type home_type_enum,
ADD COLUMN IF NOT EXISTS has_yard BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS household_members INTEGER,
ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT FALSE;

-- Agregar columnas de experiencia y motivación
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pet_experience TEXT,
ADD COLUMN IF NOT EXISTS why_adopt TEXT;

-- Agregar columnas de disponibilidad y situación económica
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS availability_hours TEXT,
ADD COLUMN IF NOT EXISTS economic_status economic_status_enum;

-- Crear índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_dni ON user_profiles(dni);
CREATE INDEX IF NOT EXISTS idx_user_profiles_district ON user_profiles(district);

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
AND column_name IN (
    'country', 'province', 'district', 
    'dni', 'birth_date', 'occupation',
    'home_type', 'has_yard', 'household_members', 'has_pets',
    'pet_experience', 'why_adopt',
    'availability_hours', 'economic_status'
)
ORDER BY column_name;
