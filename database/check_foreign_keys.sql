-- Verificar las foreign keys existentes
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
    AND tc.table_name IN ('dogs', 'adoption_requests');

-- Si las foreign keys no están bien, podemos recrearlas
-- DROP Y RECREAR LA FOREIGN KEY de dogs.rescuer_id (si es necesario)
-- ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_rescuer_id_fkey;
-- ALTER TABLE dogs ADD CONSTRAINT dogs_rescuer_id_fkey 
--   FOREIGN KEY (rescuer_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
