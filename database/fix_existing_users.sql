-- Script para actualizar usuarios existentes que no tienen first_name y last_name
-- Este script toma el Display name de auth.users y lo divide en first_name y last_name

-- Actualizar user_profiles con los nombres del metadata de auth.users
UPDATE public.user_profiles up
SET 
  first_name = COALESCE(
    au.raw_user_meta_data->>'first_name',
    SPLIT_PART(au.raw_user_meta_data->>'full_name', ' ', 1),
    SPLIT_PART(up.email, '@', 1)
  ),
  last_name = COALESCE(
    au.raw_user_meta_data->>'last_name',
    NULLIF(SUBSTRING(au.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN au.raw_user_meta_data->>'full_name') + 1), ''),
    ''
  )
FROM auth.users au
WHERE up.id = au.id
  AND (up.first_name IS NULL OR up.first_name = '' OR up.last_name IS NULL);

-- Verificar los resultados
SELECT 
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  au.raw_user_meta_data->>'full_name' as metadata_full_name,
  au.raw_user_meta_data->>'first_name' as metadata_first_name,
  au.raw_user_meta_data->>'last_name' as metadata_last_name
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id;
