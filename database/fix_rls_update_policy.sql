-- =============================================
-- Arreglar políticas RLS para permitir UPDATE
-- El problema es que updateProfileById no puede guardar datos
-- =============================================

-- Ver políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Permitir inserción durante registro" ON user_profiles;
DROP POLICY IF EXISTS "Rescuers can view adopter profiles from their requests" ON user_profiles;

-- Crear políticas completas y correctas

-- 1. SELECT: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil" 
ON user_profiles
FOR SELECT 
USING (auth.uid() = id);

-- 2. SELECT: Rescatistas pueden ver perfiles de adoptantes con solicitudes
CREATE POLICY "Rescuers can view adopter profiles from their requests"
ON user_profiles
FOR SELECT
USING (
  auth.uid() = id
  OR
  id IN (
    SELECT adopter_id 
    FROM adoption_requests 
    WHERE rescuer_id = auth.uid()
  )
);

-- 3. INSERT: Permitir inserción durante registro (CON CHECK)
CREATE POLICY "Permitir inserción durante registro" 
ON user_profiles
FOR INSERT 
WITH CHECK (true);

-- 4. UPDATE: Permitir actualización del propio perfil (CRÍTICO)
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON user_profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. UPDATE: Permitir actualización durante registro (sin sesión activa)
-- Esta es la política CLAVE para que updateProfileById funcione
CREATE POLICY "Permitir actualización después de registro" 
ON user_profiles
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd as operacion,
    qual as usando,
    with_check as verificacion
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;
