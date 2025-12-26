-- =============================================
-- Verificar el estado actual de las políticas RLS
-- =============================================

-- 1. Ver todas las políticas de user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operacion,
    qual as usando_condition,
    with_check as check_condition
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;

-- 2. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- 3. Probar UPDATE manualmente con un usuario específico
-- IMPORTANTE: Reemplaza el ID con el de estekora10@gmail.com
UPDATE user_profiles
SET 
    phone = '953222207',
    dni = '74057907',
    province = 'Lima',
    district = 'Lurin'
WHERE email = 'estekora10@gmail.com'
RETURNING *;
