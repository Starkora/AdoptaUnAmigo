-- =============================================
-- Schema para AdoptaUnAmigo
-- Base de datos: Supabase (PostgreSQL)
-- =============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Tabla: user_roles
-- Almacena los roles de los usuarios
-- =============================================
CREATE TYPE user_role_type AS ENUM ('adoptante', 'rescatista');

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    role user_role_type NOT NULL,
    organization_name TEXT, -- Solo para rescatistas
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Tabla: dogs
-- Información de los perros en adopción
-- =============================================
CREATE TYPE dog_size AS ENUM ('pequeño', 'mediano', 'grande');
CREATE TYPE dog_gender AS ENUM ('macho', 'hembra');
CREATE TYPE dog_status AS ENUM ('disponible', 'en_proceso', 'adoptado');

CREATE TABLE IF NOT EXISTS dogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    breed TEXT,
    age_years INTEGER,
    age_months INTEGER,
    size dog_size NOT NULL,
    gender dog_gender NOT NULL,
    description TEXT NOT NULL,
    medical_history TEXT,
    is_vaccinated BOOLEAN DEFAULT FALSE,
    is_sterilized BOOLEAN DEFAULT FALSE,
    status dog_status DEFAULT 'disponible',
    main_image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb, -- Array de URLs de Cloudinary
    rescuer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Tabla: adoption_requests
-- Solicitudes de adopción
-- =============================================
CREATE TYPE adoption_status AS ENUM ('pendiente', 'aprobada', 'rechazada', 'completada');

CREATE TABLE IF NOT EXISTS adoption_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    adopter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    rescuer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status adoption_status DEFAULT 'pendiente',
    message TEXT, -- Mensaje del adoptante
    response_message TEXT, -- Respuesta del rescatista
    has_experience BOOLEAN DEFAULT FALSE,
    has_other_pets BOOLEAN DEFAULT FALSE,
    has_yard BOOLEAN DEFAULT FALSE,
    reason_for_adoption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dog_id, adopter_id) -- Un adoptante no puede solicitar el mismo perro dos veces
);

-- =============================================
-- Tabla: favorites
-- Perros favoritos de los usuarios
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, dog_id)
);

-- =============================================
-- Índices para mejorar rendimiento
-- =============================================
CREATE INDEX idx_dogs_rescuer ON dogs(rescuer_id);
CREATE INDEX idx_dogs_status ON dogs(status);
CREATE INDEX idx_adoption_requests_dog ON adoption_requests(dog_id);
CREATE INDEX idx_adoption_requests_adopter ON adoption_requests(adopter_id);
CREATE INDEX idx_adoption_requests_rescuer ON adoption_requests(rescuer_id);
CREATE INDEX idx_adoption_requests_status ON adoption_requests(status);
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- =============================================
-- Triggers para updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adoption_requests_updated_at BEFORE UPDATE ON adoption_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies para user_profiles
CREATE POLICY "Los usuarios pueden ver todos los perfiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política de inserción más permisiva para el registro inicial
CREATE POLICY "Permitir inserción durante registro" ON user_profiles
    FOR INSERT WITH CHECK (true);

-- Trigger para crear automáticamente el perfil del usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear si no existe ya un perfil
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'adoptante')::user_role_type
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de crear un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Policies para dogs
CREATE POLICY "Todos pueden ver perros disponibles" ON dogs
    FOR SELECT USING (true);

CREATE POLICY "Los rescatistas pueden crear perros" ON dogs
    FOR INSERT WITH CHECK (
        auth.uid() = rescuer_id AND 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'rescatista')
    );

CREATE POLICY "Los rescatistas pueden actualizar sus perros" ON dogs
    FOR UPDATE USING (auth.uid() = rescuer_id);

CREATE POLICY "Los rescatistas pueden eliminar sus perros" ON dogs
    FOR DELETE USING (auth.uid() = rescuer_id);

-- Policies para adoption_requests
CREATE POLICY "Los usuarios pueden ver sus propias solicitudes" ON adoption_requests
    FOR SELECT USING (auth.uid() = adopter_id OR auth.uid() = rescuer_id);

CREATE POLICY "Los adoptantes pueden crear solicitudes" ON adoption_requests
    FOR INSERT WITH CHECK (
        auth.uid() = adopter_id AND 
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'adoptante')
    );

CREATE POLICY "Los rescatistas pueden actualizar solicitudes de sus perros" ON adoption_requests
    FOR UPDATE USING (auth.uid() = rescuer_id);

-- Policies para favorites
CREATE POLICY "Los usuarios pueden ver sus favoritos" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden agregar favoritos" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus favoritos" ON favorites
    FOR DELETE USING (auth.uid() = user_id);
