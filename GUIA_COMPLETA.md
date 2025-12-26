# AdoptaUnAmigo - Sistema de Adopcion de Perros

## Proyecto Configurado

Tu sistema de adopcion de perros esta listo con:
- Frontend Angular 18
- Backend NestJS
- Base de datos Supabase configurada
- Autenticacion con roles (adoptante/rescatista)
- Upload de imagenes con Cloudinary
- Servicios y guards implementados

## Como Iniciar el Proyecto

### 1. Configurar Supabase

1. **Crear proyecto en Supabase:**
   - Ve a [https://supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Guarda la URL y las API Keys

2. **Ejecutar scripts SQL:**
   - Abre el SQL Editor en Supabase
   - Copia y ejecuta el contenido de `database/schema.sql`
   - Verifica que las tablas se crearon correctamente

3. **Configurar autenticación:**
   - Ve a Authentication → Settings
   - Habilita Email provider
   - Configura Site URL: `http://localhost:4200`
   - Añade redirect URL: `http://localhost:4200/**`

### 2. Configurar Cloudinary

1. **Crear cuenta:**
   - Ve a [https://cloudinary.com](https://cloudinary.com)
   - Regístrate gratis

2. **Obtener credenciales:**
   - Ve a Dashboard
   - Copia: Cloud Name, API Key, API Secret

### 3. Configurar Backend

```bash
cd backend

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales
# SUPABASE_URL=tu_url
# SUPABASE_KEY=tu_service_role_key
# CLOUDINARY_CLOUD_NAME=tu_cloud_name
# CLOUDINARY_API_KEY=tu_api_key
# CLOUDINARY_API_SECRET=tu_api_secret

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor
npm run start:dev
```

Backend corriendo en: http://localhost:3000

### 4. Configurar Frontend

```bash
cd frontend

# Editar archivo de environment
# Abre: src/environments/environment.ts
# Reemplaza:
# - supabaseUrl: 'tu_url_de_supabase'
# - supabaseKey: 'tu_anon_key_de_supabase'

# Instalar dependencias (si no están instaladas)
npm install

# Iniciar aplicación
ng serve
# o
npm start
```

Frontend corriendo en: http://localhost:4200

## Funcionalidades Implementadas

### Autenticación
- Login con email y contraseña
- Registro con selección de rol:
  - **Adoptante**: Usuarios que buscan adoptar
  - **Rescatista**: Refugios/personas que dan en adopción
- Protección de rutas con guards
- Perfil de usuario

### Backend
- API REST con NestJS
- Upload de imágenes a Cloudinary
- CORS configurado
- Validaciones

### Base de Datos
- Tablas: user_profiles, dogs, adoption_requests, favorites
- Row Level Security (RLS) configurado
- Triggers para updated_at
- Índices para rendimiento

## Próximos Pasos (Para Completar)

### Frontend - Componentes Pendientes

1. **Home Component** (`pages/home`)
   - Página de inicio con búsqueda
   - Perros destacados
   - Call to action

2. **Dog List Component** (`pages/dogs/dog-list`)
   - Listado de perros disponibles
   - Filtros por tamaño, género, ubicación
   - Búsqueda por nombre/raza

3. **Dog Detail Component** (`pages/dogs/dog-detail`)
   - Detalles completos del perro
   - Galería de imágenes
   - Botón "Solicitar Adopción"

4. **Adopter Dashboard** (`pages/dashboard/adopter-dashboard`)
   - Mis solicitudes de adopción
   - Estado de solicitudes
   - Perros favoritos

5. **Rescuer Dashboard** (`pages/dashboard/rescuer-dashboard`)
   - Mis perros publicados
   - Crear/editar perros
   - Gestionar solicitudes recibidas
   - Upload de imágenes

6. **Profile Component** (`pages/dashboard/profile`)
   - Editar perfil
   - Cambiar foto
   - Actualizar información de contacto

### Servicios Implementados

Los servicios ya están listos en `src/app/services/`:
- `auth.service.ts` - Autenticación y gestión de usuarios
- `dog.service.ts` - CRUD de perros
- `adoption.service.ts` - Gestión de adopciones
- `upload.service.ts` - Upload de imágenes

### Modelos Definidos

Los tipos TypeScript están en `src/app/models/`:
- `user.model.ts` - Tipos de usuario y roles
- `dog.model.ts` - Modelo de perros
- `adoption.model.ts` - Modelo de adopciones

## Estilización

El proyecto usa **Tailwind CSS** (recomendado). Para instalarlo:

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configura `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Agrega en `src/styles.scss`:

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Dependencias Instaladas

### Frontend
- Angular 18
- @supabase/supabase-js
- RxJS
- TypeScript

### Backend
- NestJS
- @supabase/supabase-js
- cloudinary
- class-validator
- class-transformer
- multer

## Seguridad

- Row Level Security en Supabase
- Guards de autenticación
- Guards por rol
- Validación de imágenes
- CORS configurado

## Estructura del Código

```
AdoptaUnAmigo/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── guards/          # Auth guards
│       │   ├── models/          # TypeScript interfaces
│       │   ├── pages/           # Componentes de páginas
│       │   │   ├── auth/        # Login/Register
│       │   │   ├── dashboard/   # Dashboards
│       │   │   └── dogs/        # Listado y detalle
│       │   └── services/        # Servicios de API
│       └── environments/        # Configuración
├── backend/
│   └── src/
│       ├── upload/              # Módulo de upload
│       ├── app.module.ts
│       └── main.ts
└── database/
    ├── schema.sql               # Esquema de BD
    ├── seed.sql                 # Datos de prueba
    └── README.md
```

## Debugging

### Frontend no conecta con Backend
- Verifica que el backend esté corriendo en puerto 3000
- Revisa `environment.ts` que `apiUrl` sea correcto
- Verifica CORS en `backend/src/main.ts`

### Error de autenticación
- Verifica credenciales de Supabase
- Revisa que RLS policies estén configuradas
- Confirma que el email esté verificado

### Error de upload
- Verifica credenciales de Cloudinary
- Revisa que el backend esté corriendo
- Confirma que el archivo sea imagen válida

## Testing

```bash
# Frontend
cd frontend
ng test

# Backend
cd backend
npm run test
```

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
ng build --configuration production
# Despliega la carpeta dist/frontend
```

### Backend (Railway/Heroku)
```bash
cd backend
npm run build
# Configura variables de entorno
# Despliega
```

## Soporte

Si tienes dudas:
1. Revisa la documentación de Supabase
2. Consulta docs de Angular y NestJS
3. Revisa los archivos README en cada carpeta

## Listo

Tu sistema de adopción de perros está configurado y listo para desarrollar. Los componentes principales están creados, solo falta implementar la UI y la lógica de negocio en cada uno.

**Feliz coding**
