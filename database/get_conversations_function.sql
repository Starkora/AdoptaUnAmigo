-- =====================================================
-- FUNCIÓN RPC PARA OBTENER CONVERSACIONES CON ÚLTIMO MENSAJE
-- =====================================================

-- Esta función obtiene todas las conversaciones únicas de un usuario
-- junto con el último mensaje, contador de no leídos y detalles del perro si aplica

CREATE OR REPLACE FUNCTION get_conversations(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  last_message TEXT,
  last_message_date TIMESTAMPTZ,
  unread_count BIGINT,
  dog_id UUID,
  dog_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_users AS (
    -- Obtener todos los usuarios con los que el usuario actual ha tenido conversaciones
    SELECT DISTINCT
      CASE 
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS other_user_id,
      m.dog_id
    FROM messages m
    WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
  ),
  last_messages AS (
    -- Obtener el último mensaje de cada conversación
    SELECT DISTINCT ON (
      CASE 
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
      END,
      m.dog_id
    )
      CASE 
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS other_user_id,
      m.message,
      m.created_at,
      m.dog_id
    FROM messages m
    WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    ORDER BY 
      CASE 
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
      END,
      m.dog_id,
      m.created_at DESC
  ),
  unread_counts AS (
    -- Contar mensajes no leídos por conversación
    SELECT 
      m.sender_id AS other_user_id,
      m.dog_id,
      COUNT(*) AS unread_count
    FROM messages m
    WHERE m.receiver_id = p_user_id 
      AND m.is_read = false
    GROUP BY m.sender_id, m.dog_id
  )
  SELECT 
    cu.other_user_id,
    CONCAT(up.first_name, ' ', up.last_name) AS user_name,
    up.avatar_url,
    lm.message AS last_message,
    lm.created_at AS last_message_date,
    COALESCE(uc.unread_count, 0) AS unread_count,
    cu.dog_id,
    d.name AS dog_name
  FROM conversation_users cu
  LEFT JOIN user_profiles up ON cu.other_user_id = up.id
  LEFT JOIN last_messages lm ON cu.other_user_id = lm.other_user_id 
    AND (cu.dog_id = lm.dog_id OR (cu.dog_id IS NULL AND lm.dog_id IS NULL))
  LEFT JOIN unread_counts uc ON cu.other_user_id = uc.other_user_id 
    AND (cu.dog_id = uc.dog_id OR (cu.dog_id IS NULL AND uc.dog_id IS NULL))
  LEFT JOIN dogs d ON cu.dog_id = d.id
  ORDER BY lm.created_at DESC;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_conversations(UUID) TO authenticated;

-- Comentarios para documentación
COMMENT ON FUNCTION get_conversations(UUID) IS 'Obtiene todas las conversaciones de un usuario con el último mensaje, contador de no leídos y detalles del perro si aplica';
