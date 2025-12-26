-- =============================================
-- Verificar y arreglar el trigger handle_new_user
-- =============================================

-- 1. Ver la definición actual del trigger
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Ver la función del trigger
SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- 3. Verificar logs de errores (si el trigger está fallando)
-- Nota: Esto solo funciona si tienes acceso a los logs

-- 4. Recrear el trigger con mejor manejo de errores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear función mejorada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role user_role_type;
BEGIN
  -- Log para debugging
  RAISE NOTICE 'Creando perfil para usuario: %', NEW.id;
  
  -- Convertir role de string a enum
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role_type, 'adoptante');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error convirtiendo role, usando adoptante por defecto';
      v_role := 'adoptante';
  END;
  
  -- Insertar el perfil
  INSERT INTO public.user_profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    organization_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role,
    NEW.raw_user_meta_data->>'organization_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    organization_name = EXCLUDED.organization_name,
    updated_at = NOW();
    
  RAISE NOTICE 'Perfil creado exitosamente para: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error en handle_new_user para %: %', NEW.id, SQLERRM;
    RETURN NEW; -- No fallar el registro del usuario
END;
$$;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- Verificar que se creó correctamente
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
