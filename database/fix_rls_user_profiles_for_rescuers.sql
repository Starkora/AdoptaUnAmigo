-- Política RLS para permitir que los rescatistas vean los perfiles de los adoptantes
-- que tienen solicitudes de adopción en sus perros

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Rescuers can view adopter profiles from their requests" ON user_profiles;

-- Crear política que permite a los rescatistas ver perfiles de adoptantes con solicitudes
CREATE POLICY "Rescuers can view adopter profiles from their requests"
ON user_profiles
FOR SELECT
USING (
  -- El usuario puede ver su propio perfil
  auth.uid() = id
  OR
  -- O puede ver perfiles de adoptantes que tienen solicitudes en sus perros
  id IN (
    SELECT adopter_id 
    FROM adoption_requests 
    WHERE rescuer_id = auth.uid()
  )
);

-- Verificar que la política se creó correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';
