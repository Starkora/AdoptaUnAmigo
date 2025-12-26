-- =============================================
-- Solución para error RLS en tabla dogs
-- =============================================

-- PASO 1: Verificar perfiles existentes
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    organization_name
FROM user_profiles
ORDER BY created_at DESC;

-- PASO 2: Si tu usuario no tiene el rol correcto, actualízalo
-- Reemplaza 'tu-email@ejemplo.com' con tu email real
UPDATE user_profiles
SET role = 'rescatista'
WHERE email = 'tu-email@ejemplo.com';

-- PASO 3: Verificar las políticas RLS actuales de dogs
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
WHERE tablename = 'dogs';

-- PASO 4: (OPCIONAL) Si las políticas no existen, créalas
-- Solo ejecuta esto si no hay políticas creadas

-- Eliminar políticas existentes si quieres recrearlas
-- DROP POLICY IF EXISTS "Todos pueden ver perros disponibles" ON dogs;
-- DROP POLICY IF EXISTS "Los rescatistas pueden crear perros" ON dogs;
-- DROP POLICY IF EXISTS "Los rescatistas pueden actualizar sus perros" ON dogs;
-- DROP POLICY IF EXISTS "Los rescatistas pueden eliminar sus perros" ON dogs;

-- Recrear políticas
-- CREATE POLICY "Todos pueden ver perros disponibles" ON dogs
--     FOR SELECT USING (true);

-- CREATE POLICY "Los rescatistas pueden crear perros" ON dogs
--     FOR INSERT WITH CHECK (
--         auth.uid() = rescuer_id AND 
--         EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'rescatista')
--     );

-- CREATE POLICY "Los rescatistas pueden actualizar sus perros" ON dogs
--     FOR UPDATE USING (auth.uid() = rescuer_id);

-- CREATE POLICY "Los rescatistas pueden eliminar sus perros" ON dogs
--     FOR DELETE USING (auth.uid() = rescuer_id);

-- PASO 5: Verificar que el trigger handle_new_user está funcionando
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth';

-- PASO 6: Probar la política manualmente
-- Reemplaza los valores con tus datos reales
-- SELECT 
--     auth.uid() AS current_user_id,
--     (SELECT role FROM user_profiles WHERE id = auth.uid()) AS current_role,
--     (SELECT id FROM user_profiles WHERE id = auth.uid() AND role = 'rescatista') AS has_rescuer_role;
