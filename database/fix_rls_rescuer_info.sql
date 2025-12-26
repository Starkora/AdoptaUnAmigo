-- Política para permitir leer información pública de rescatistas
-- Esta política permite que cualquiera pueda leer los datos básicos de los rescatistas
-- necesarios para mostrar en las publicaciones de perros

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Permitir lectura pública de información de rescatistas" ON user_profiles;

-- Crear política que permite leer información pública de los rescatistas
CREATE POLICY "Permitir lectura pública de información de rescatistas"
ON user_profiles
FOR SELECT
USING (
  role = 'rescatista' 
);

-- Comentario explicativo
COMMENT ON POLICY "Permitir lectura pública de información de rescatistas" ON user_profiles IS 
'Permite a todos los usuarios leer información básica de rescatistas para mostrar en las publicaciones de perros';
