-- Agregar las foreign keys que faltan en la tabla dogs
-- Esta es la foreign key crítica que causa el error en el dashboard

-- 1. Agregar foreign key de dogs.rescuer_id -> user_profiles(id)
ALTER TABLE dogs 
DROP CONSTRAINT IF EXISTS dogs_rescuer_id_fkey;

ALTER TABLE dogs 
ADD CONSTRAINT dogs_rescuer_id_fkey 
FOREIGN KEY (rescuer_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 2. Agregar foreign keys faltantes en adoption_requests (si no existen)
ALTER TABLE adoption_requests 
DROP CONSTRAINT IF EXISTS adoption_requests_adopter_id_fkey;

ALTER TABLE adoption_requests 
ADD CONSTRAINT adoption_requests_adopter_id_fkey 
FOREIGN KEY (adopter_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE adoption_requests 
DROP CONSTRAINT IF EXISTS adoption_requests_rescuer_id_fkey;

ALTER TABLE adoption_requests 
ADD CONSTRAINT adoption_requests_rescuer_id_fkey 
FOREIGN KEY (rescuer_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Verificar que todas las foreign keys se crearon correctamente
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('dogs', 'adoption_requests')
ORDER BY tc.table_name, kcu.column_name;
