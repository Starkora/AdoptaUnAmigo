# Base de Datos - AdoptaUnAmigo

Configuración de la base de datos en Supabase.

## Instrucciones de Setup

### 1. Crear Proyecto en Supabase
1. Ir a [https://supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Guardar:
   - Project URL
   - Anon/Public Key
   - Service Role Key (para backend)

### 2. Ejecutar Scripts SQL

#### Opción A: Desde Supabase Dashboard
1. Ir a SQL Editor en tu proyecto
2. Copiar el contenido de `schema.sql`
3. Ejecutar

#### Opción B: Desde la CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref your-project-ref

# Ejecutar migrations
supabase db push
```

### 3. Verificar Tablas Creadas

Deberías ver estas tablas:
- user_profiles
- dogs
- adoption_requests
- favorites

### 4. Configurar Autenticación

En Supabase Dashboard:

**Authentication → Providers:**
- Habilitar Email
- Configurar Email templates (opcional)

**Authentication → URL Configuration:**
- Site URL: `http://localhost:4200` (desarrollo)
- Redirect URLs: `http://localhost:4200/auth/callback`

### 5. Datos de Prueba (Opcional)

Después de registrar usuarios, puedes usar `seed.sql` para insertar perros de ejemplo.

## Row Level Security (RLS)

Las policies RLS ya están configuradas en `schema.sql`:

### user_profiles
- Todos pueden ver perfiles
- Solo puedes editar tu propio perfil

### dogs
- Todos pueden ver perros
- Solo rescatistas pueden crear/editar/eliminar

### adoption_requests
- Solo ves tus propias solicitudes
- Rescatistas pueden responder solicitudes

### favorites
- Solo ves y gestionas tus favoritos

## Esquema de Datos

### user_profiles
```sql
- id (UUID, FK a auth.users)
- email
- full_name
- phone
- address
- role ('adoptante' | 'rescatista')
- organization_name (solo rescatistas)
- description
- avatar_url
```

### dogs
```sql
- id (UUID)
- name
- breed
- age_years, age_months
- size ('pequeño' | 'mediano' | 'grande')
- gender ('macho' | 'hembra')
- description
- medical_history
- is_vaccinated
- is_sterilized
- status ('disponible' | 'en_proceso' | 'adoptado')
- main_image_url
- images (JSONB array)
- rescuer_id (FK a user_profiles)
- location
```

### adoption_requests
```sql
- id (UUID)
- dog_id (FK a dogs)
- adopter_id (FK a user_profiles)
- rescuer_id (FK a user_profiles)
- status ('pendiente' | 'aprobada' | 'rechazada' | 'completada')
- message
- response_message
- has_experience
- has_other_pets
- has_yard
- reason_for_adoption
```

### favorites
```sql
- id (UUID)
- user_id (FK a user_profiles)
- dog_id (FK a dogs)
```

## Mantenimiento

### Backup
```bash
# Desde Supabase CLI
supabase db dump -f backup.sql
```

### Ver Logs
```bash
supabase db logs
```

## Troubleshooting

**Error: RLS policies bloqueando inserts**
- Verifica que el usuario esté autenticado
- Verifica que el role sea correcto
- Revisa que auth.uid() coincida con el user_id

**Error: Foreign key violation**
- Asegúrate de crear el perfil de usuario después del registro
- Usa el mismo UUID de auth.users

**Error: ENUM type no existe**
- Ejecuta primero los CREATE TYPE antes de CREATE TABLE
