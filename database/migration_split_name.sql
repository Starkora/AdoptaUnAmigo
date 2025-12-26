-- =============================================
-- Migración: Separar full_name en first_name y last_name
-- =============================================

-- 1. Agregar las nuevas columnas si no existen
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';

-- 2. Migrar datos existentes SOLO si la columna full_name existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'full_name'
  ) THEN
    -- Migrar datos de full_name a first_name y last_name
    UPDATE user_profiles
    SET 
      first_name = CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN 
          TRIM(SPLIT_PART(full_name, ' ', 1))
        ELSE ''
      END,
      last_name = CASE 
        WHEN full_name IS NOT NULL AND full_name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 THEN 
          TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
        ELSE ''
      END
    WHERE full_name IS NOT NULL;
    
    -- Eliminar la columna full_name
    ALTER TABLE user_profiles DROP COLUMN full_name;
  END IF;
END $$;

-- 3. Hacer las columnas NOT NULL después de migrar los datos
ALTER TABLE user_profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- 4. Actualizar el trigger para usar first_name y last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear si no existe ya un perfil
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_profiles (id, email, first_name, last_name, role, organization_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'adoptante')::user_role_type,
      COALESCE(NEW.raw_user_meta_data->>'organization_name', NULL)
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verificar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
