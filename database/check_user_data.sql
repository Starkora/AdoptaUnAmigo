-- Consultar todos los datos del usuario Maria Perez
SELECT 
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    -- Ubicación
    country,
    province,
    district,
    address,
    -- Información Personal
    dni,
    birth_date,
    occupation,
    -- Vivienda
    home_type,
    has_yard,
    household_members,
    has_pets,
    -- Experiencia
    pet_experience,
    why_adopt,
    -- Disponibilidad
    availability_hours,
    economic_status,
    -- Metadatos
    created_at,
    updated_at
FROM user_profiles
WHERE email = 'estekora0@gmail.com'
ORDER BY created_at DESC;

-- Ver TODOS los usuarios con sus datos de verificación
SELECT 
    email,
    first_name,
    last_name,
    role,
    phone,
    dni,
    birth_date,
    province,
    district,
    home_type,
    household_members,
    pet_experience IS NOT NULL as tiene_experiencia,
    why_adopt IS NOT NULL as tiene_motivacion,
    created_at
FROM user_profiles
ORDER BY created_at DESC;
