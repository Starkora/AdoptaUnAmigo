-- =============================================
-- Fix RLS Policies for adoption_requests
-- =============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias solicitudes" ON adoption_requests;
DROP POLICY IF EXISTS "Los adoptantes pueden crear solicitudes" ON adoption_requests;
DROP POLICY IF EXISTS "Los rescatistas pueden actualizar solicitudes de sus perros" ON adoption_requests;

-- Política para ver solicitudes
CREATE POLICY "Los usuarios pueden ver sus propias solicitudes" ON adoption_requests
    FOR SELECT USING (
        auth.uid() = adopter_id OR auth.uid() = rescuer_id
    );

-- Política para crear solicitudes - más permisiva
CREATE POLICY "Los adoptantes pueden crear solicitudes" ON adoption_requests
    FOR INSERT WITH CHECK (
        auth.uid() = adopter_id AND 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'adoptante'
        )
    );

-- Política para actualizar solicitudes
CREATE POLICY "Los rescatistas pueden actualizar solicitudes de sus perros" ON adoption_requests
    FOR UPDATE USING (
        auth.uid() = rescuer_id
    );

-- Política para eliminar solicitudes (opcional)
CREATE POLICY "Los adoptantes pueden cancelar sus solicitudes pendientes" ON adoption_requests
    FOR DELETE USING (
        auth.uid() = adopter_id AND status = 'pendiente'
    );
