-- =====================================================
-- MIGRATION: ADD CANCELLATION FIELDS TO ADOPTION_REQUESTS
-- =====================================================
-- Este script agrega soporte para que los adoptantes puedan cancelar
-- sus solicitudes de adopción aprobadas con seguimiento de motivo y fecha

-- PASO 1: Ejecuta este bloque primero
-- Agregar el nuevo valor al enum adoption_status si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'cancelada_por_adoptante' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'adoption_status')
  ) THEN
    ALTER TYPE adoption_status ADD VALUE 'cancelada_por_adoptante';
  END IF;
END $$;

-- IMPORTANTE: Después de ejecutar el bloque anterior, ejecuta el resto del script
-- o simplemente ejecuta todo de nuevo y PostgreSQL ignorará lo que ya existe

-- PASO 2: Agregar los nuevos campos a la tabla adoption_requests
ALTER TABLE adoption_requests
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- PASO 3: Agregar índice para búsquedas de cooldown (sin filtro WHERE por ahora)
CREATE INDEX IF NOT EXISTS idx_adoption_requests_cooldown 
ON adoption_requests(dog_id, adopter_id, status, cancelled_at);

-- PASO 4: Comentarios para documentación
COMMENT ON COLUMN adoption_requests.cancellation_reason IS 'Motivo opcional por el cual el adoptante canceló la solicitud';
COMMENT ON COLUMN adoption_requests.cancelled_at IS 'Fecha y hora en que se canceló la solicitud (para cooldown period)';

-- PASO 5: Agregar constraint para asegurar que cancelled_at solo existe cuando status es cancelada_por_adoptante
-- Este constraint se ejecutará correctamente porque no usa el enum en tiempo de definición
ALTER TABLE adoption_requests
  DROP CONSTRAINT IF EXISTS check_cancellation_fields;

ALTER TABLE adoption_requests
  ADD CONSTRAINT check_cancellation_fields
  CHECK (
    (status::text = 'cancelada_por_adoptante' AND cancelled_at IS NOT NULL) OR
    (status::text != 'cancelada_por_adoptante')
  );

-- Verificación
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'adoption_requests'
  AND column_name IN ('cancellation_reason', 'cancelled_at', 'status')
ORDER BY ordinal_position;

COMMENT ON TABLE adoption_requests IS 'Tabla de solicitudes de adopción con soporte para cancelación por adoptante y periodo de cooldown de 7 días';
