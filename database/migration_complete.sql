-- =============================================
-- Migración Completa: Recrear user_profiles con first_name y last_name
-- =============================================

-- PASO 1: Eliminar todo lo existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Permitir inserción durante registro" ON user_profiles;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- PASO 2: Crear el tipo ENUM si no existe
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('adoptante', 'rescatista');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PASO 3: Crear la tabla con la nueva estructura
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    address TEXT,
    role user_role_type NOT NULL DEFAULT 'adoptante',
    organization_name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 4: Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- PASO 5: Crear políticas de seguridad
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Permitir inserción durante registro" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- PASO 6: Crear función para el trigger con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar directamente, el ON CONFLICT manejará duplicados
  INSERT INTO public.user_profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    organization_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role_type, 'adoptante'),
    NEW.raw_user_meta_data->>'organization_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    organization_name = EXCLUDED.organization_name,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log el error pero no fallar el registro
    RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- PASO 7: Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASO 8: Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
