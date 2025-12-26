-- =============================================
-- MIGRACIONES PARA NUEVAS FUNCIONALIDADES
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TABLA DE MENSAJES (Sistema de Mensajería)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_dog ON messages(dog_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- =============================================
-- 2. TABLA DE FAVORITOS
-- =============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dog_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_dog ON favorites(dog_id);

-- RLS para favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
ON favorites FOR ALL
USING (auth.uid() = user_id);

-- =============================================
-- 3. TABLA DE CITAS (Calendario de Visitas)
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adopter_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rescuer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_adopter ON appointments(adopter_id);
CREATE INDEX IF NOT EXISTS idx_appointments_rescuer ON appointments(rescuer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dog ON appointments(dog_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- RLS para appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (auth.uid() = adopter_id OR auth.uid() = rescuer_id);

CREATE POLICY "Adopters can create appointments"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = adopter_id);

CREATE POLICY "Rescuers can update appointments"
ON appointments FOR UPDATE
USING (auth.uid() = rescuer_id);

-- =============================================
-- 4. TABLA DE REVIEWS/TESTIMONIOS
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rescuer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, rescuer_id, dog_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_rescuer ON reviews(rescuer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- RLS para reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved reviews"
ON reviews FOR SELECT
USING (is_approved = TRUE);

CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

-- =============================================
-- 5. TABLA DE SEGUIMIENTO POST-ADOPCIÓN
-- =============================================
CREATE TABLE IF NOT EXISTS adoption_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_request_id UUID NOT NULL REFERENCES adoption_requests(id) ON DELETE CASCADE,
  followup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completado')),
  dog_health TEXT,
  dog_behavior TEXT,
  adopter_satisfaction INTEGER CHECK (adopter_satisfaction >= 1 AND adopter_satisfaction <= 5),
  photos TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_request ON adoption_followups(adoption_request_id);
CREATE INDEX IF NOT EXISTS idx_followups_date ON adoption_followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON adoption_followups(status);

-- RLS para adoption_followups
ALTER TABLE adoption_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users involved can view followups"
ON adoption_followups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM adoption_requests ar
    WHERE ar.id = adoption_request_id
    AND (ar.adopter_id = auth.uid() OR ar.dog_id IN (
      SELECT id FROM dogs WHERE rescuer_id = auth.uid()
    ))
  )
);

CREATE POLICY "Adopters can update their followups"
ON adoption_followups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM adoption_requests ar
    WHERE ar.id = adoption_request_id AND ar.adopter_id = auth.uid()
  )
);

-- =============================================
-- 6. TABLA DE PREFERENCIAS DE NOTIFICACIONES
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  new_dogs BOOLEAN DEFAULT TRUE,
  messages BOOLEAN DEFAULT TRUE,
  appointments BOOLEAN DEFAULT TRUE,
  adoption_status BOOLEAN DEFAULT TRUE,
  followups BOOLEAN DEFAULT TRUE,
  favorites_updates BOOLEAN DEFAULT TRUE,
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- RLS para notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- =============================================
-- 7. TABLA DE LOGS DE AUDITORÍA
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- RLS para audit_logs (solo admins pueden ver)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage audit logs"
ON audit_logs FOR ALL
USING (auth.role() = 'service_role');

-- =============================================
-- 8. AGREGAR CAMPOS NUEVOS A TABLA DOGS
-- =============================================
ALTER TABLE dogs
ADD COLUMN IF NOT EXISTS energy_level VARCHAR(20) CHECK (energy_level IN ('bajo', 'medio', 'alto')),
ADD COLUMN IF NOT EXISTS good_with_kids BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS good_with_dogs BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS good_with_cats BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS special_needs TEXT,
ADD COLUMN IF NOT EXISTS experience_required VARCHAR(20) CHECK (experience_required IN ('ninguna', 'basica', 'intermedia', 'avanzada')),
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'alto', 'urgente')),
ADD COLUMN IF NOT EXISTS days_in_shelter INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_dogs_energy ON dogs(energy_level);
CREATE INDEX IF NOT EXISTS idx_dogs_urgency ON dogs(urgency_level);
CREATE INDEX IF NOT EXISTS idx_dogs_view_count ON dogs(view_count DESC);

-- =============================================
-- 9. AGREGAR CAMPOS A USER_PROFILES
-- =============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dni_document_url TEXT,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

CREATE INDEX IF NOT EXISTS idx_profiles_verified ON user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON user_profiles(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON user_profiles(latitude, longitude);

-- =============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =============================================
COMMENT ON TABLE messages IS 'Sistema de mensajería interna entre usuarios';
COMMENT ON TABLE favorites IS 'Perros favoritos de los usuarios';
COMMENT ON TABLE appointments IS 'Calendario de citas para visitas';
COMMENT ON TABLE reviews IS 'Reviews y testimonios de rescatistas';
COMMENT ON TABLE adoption_followups IS 'Seguimiento post-adopción';
COMMENT ON TABLE notification_preferences IS 'Preferencias de notificaciones';
COMMENT ON TABLE audit_logs IS 'Logs de auditoría del sistema';

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR RATING DE RESCATISTAS
-- =============================================
CREATE OR REPLACE FUNCTION update_rescuer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE rescuer_id = NEW.rescuer_id AND is_approved = TRUE
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE rescuer_id = NEW.rescuer_id AND is_approved = TRUE
    )
  WHERE id = NEW.rescuer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_rating ON reviews;
CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_rescuer_rating();

-- =============================================
-- FUNCIÓN PARA CONTAR DÍAS EN REFUGIO
-- =============================================
CREATE OR REPLACE FUNCTION update_days_in_shelter()
RETURNS void AS $$
BEGIN
  UPDATE dogs
  SET days_in_shelter = EXTRACT(DAY FROM NOW() - created_at)::INTEGER
  WHERE status = 'disponible';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Puedes ejecutar esto con un cron job
-- SELECT cron.schedule('update-shelter-days', '0 0 * * *', 'SELECT update_days_in_shelter()');
