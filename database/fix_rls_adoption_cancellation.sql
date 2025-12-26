-- Permitir a los adoptantes cancelar sus propias solicitudes aprobadas
-- Solo pueden cambiar el status a 'cancelada_por_adoptante' y agregar razón/fecha

-- Primero, verificar si la política ya existe y eliminarla
DROP POLICY IF EXISTS "Adoptantes pueden cancelar sus solicitudes aprobadas" ON adoption_requests;

-- Crear la política para permitir UPDATE de cancelación
CREATE POLICY "Adoptantes pueden cancelar sus solicitudes aprobadas"
ON adoption_requests
FOR UPDATE
USING (
  -- El usuario actual debe ser el adoptante
  auth.uid() = adopter_id
  AND
  -- La solicitud debe estar aprobada
  status = 'aprobada'
)
WITH CHECK (
  -- El usuario actual debe ser el adoptante
  auth.uid() = adopter_id
  AND
  -- El nuevo status debe ser cancelada_por_adoptante
  status = 'cancelada_por_adoptante'
);

-- Verificar las políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'adoption_requests' 
ORDER BY policyname;
