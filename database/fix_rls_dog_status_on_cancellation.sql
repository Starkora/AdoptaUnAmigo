-- Permitir a los adoptantes actualizar el estado del perro a 'disponible' 
-- cuando cancelan su solicitud aprobada

-- Primero, verificar si la política ya existe y eliminarla
DROP POLICY IF EXISTS "Adoptantes pueden devolver perros a disponible al cancelar" ON dogs;

-- Crear la política para permitir que adoptantes actualicen el perro a disponible
CREATE POLICY "Adoptantes pueden devolver perros a disponible al cancelar"
ON dogs
FOR UPDATE
USING (
  -- El perro debe tener una solicitud aprobada del adoptante actual
  EXISTS (
    SELECT 1
    FROM adoption_requests
    WHERE adoption_requests.dog_id = dogs.id
      AND adoption_requests.adopter_id = auth.uid()
      AND adoption_requests.status = 'aprobada'
  )
  AND
  -- El perro debe estar adoptado actualmente
  status = 'adoptado'
)
WITH CHECK (
  -- Solo pueden cambiar el status a 'disponible'
  status = 'disponible'
);

-- Verificar las políticas de dogs
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'dogs'
ORDER BY policyname;
