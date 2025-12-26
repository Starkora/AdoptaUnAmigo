-- =============================================
-- Migración Simple: Actualizar user_profiles a first_name y last_name
-- =============================================

-- PASO 1: Primero elimina la tabla user_profiles y sus políticas
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Permitir inserción durante registro" ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS user_profiles CASCADE;

-- PASO 2: Crear la tabla con la nueva estructura
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role user_role_type NOT NULL,
    organization_name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 3: Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas de seguridad
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Permitir inserción durante registro" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- PASO 5: Crear función para el trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- PASO 6: Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
