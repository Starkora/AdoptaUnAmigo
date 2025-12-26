-- Crear bucket para avatares (ejecutar en Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política de storage: Permitir a usuarios autenticados subir sus propios avatares
CREATE POLICY "Los usuarios pueden subir sus propios avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de storage: Permitir a usuarios autenticados actualizar sus propios avatares
CREATE POLICY "Los usuarios pueden actualizar sus propios avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de storage: Permitir a usuarios autenticados eliminar sus propios avatares
CREATE POLICY "Los usuarios pueden eliminar sus propios avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de storage: Permitir a todos ver los avatares (público)
CREATE POLICY "Los avatares son públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
