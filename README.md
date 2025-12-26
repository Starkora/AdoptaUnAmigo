# AdoptaUnAmigo - Sistema de Adopción de Perros

Sistema web completo para conectar adoptantes con rescatistas y refugios de animales.

## Estado del Proyecto

**Proyecto Base Configurado**
- Frontend Angular 18 con componentes generados
- Backend NestJS con upload de imágenes
- Base de datos Supabase completamente diseñada
- Autenticación con roles implementada
- Servicios y guards listos

## Stack Tecnológico

- **Frontend:** Angular 18 + TypeScript + SCSS
- **Backend:** NestJS + TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Almacenamiento:** Cloudinary (imágenes)
- **Autenticación:** Supabase Auth

## Estructura del Proyecto

```
AdoptaUnAmigo/
├── frontend/          # Aplicación Angular
│   ├── src/app/
│   │   ├── guards/           [OK] Auth guards implementados
│   │   ├── models/           [OK] TypeScript interfaces
│   │   ├── pages/            [OK] Componentes generados
│   │   │   ├── auth/         [OK] Login y Register completos
│   │   │   ├── dashboard/    [TODO] Por implementar UI
│   │   │   └── dogs/         [TODO] Por implementar UI
│   │   └── services/         [OK] Todos los servicios listos
│   └── src/environments/     [TODO] Configurar credenciales
├── backend/           # API NestJS
│   ├── src/
│   │   ├── upload/           [OK] Módulo de Cloudinary completo
│   │   ├── app.module.ts     [OK] Configurado
│   │   └── main.ts           [OK] CORS y prefix configurados
│   └── .env.example          [TODO] Crear .env con credenciales
└── database/          # Scripts SQL
    ├── schema.sql            [OK] Esquema completo con RLS
    ├── seed.sql              [OK] Datos de ejemplo
    └── README.md             [OK] Instrucciones de setup
```

## Características

### Implementado
- [OK] Sistema de autenticación completo (login/registro)
- [OK] Roles: Adoptante y Rescatista
- [OK] Guards de autorización por rol
- [OK] Servicios de API para dogs, adoptions, auth
- [OK] Upload de imágenes a Cloudinary
- [OK] Base de datos con Row Level Security
- [OK] Modelos TypeScript completos

### Por Implementar
- [TODO] UI de los dashboards (rescatista y adoptante)
- [TODO] UI del listado y detalle de perros
- [TODO] UI del formulario de crear/editar perros
- [TODO] UI del sistema de solicitudes de adopción
- [TODO] Página de inicio (home)
- [TODO] Instalar y configurar Tailwind CSS (opcional)

## Quick Start

### 1. Configurar Supabase

```bash
# 1. Crea un proyecto en https://supabase.com
# 2. Ve al SQL Editor
# 3. Ejecuta el contenido de database/schema.sql
# 4. Guarda tu URL y Anon Key
```

### 2. Configurar Cloudinary

```bash
# 1. Crea cuenta en https://cloudinary.com
# 2. Copia: Cloud Name, API Key, API Secret
```

### 3. Configurar Backend

```bash
cd backend

# Crear .env desde el ejemplo
cp .env.example .env

# Editar .env con tus credenciales de Supabase y Cloudinary
# Luego instalar y correr:
npm install
npm run start:dev
```

[OK] Backend en: **http://localhost:3000**

### 4. Configurar Frontend

```bash
cd frontend

# Editar src/environments/environment.ts
# Reemplaza YOUR_SUPABASE_URL y YOUR_SUPABASE_ANON_KEY

# Luego instalar y correr:
npm install
ng serve
```

[OK] Frontend en: **http://localhost:4200**

## Documentación Completa

Lee [GUIA_COMPLETA.md](GUIA_COMPLETA.md) para:
- Instrucciones detalladas de configuración
- Lista de componentes a implementar
- Estructura del código
- Guía de desarrollo
- Troubleshooting

## Componentes por Implementar

### Auth (Completos)
- [x] Login Component
- [x] Register Component (con selección de rol)

### Páginas Principales (HTML por crear)
- [ ] Home - Página de inicio con búsqueda
- [ ] Dog List - Listado con filtros
- [ ] Dog Detail - Detalle completo con galería

### Dashboards (HTML por crear)
- [ ] Adopter Dashboard - Mis solicitudes y favoritos
- [ ] Rescuer Dashboard - Gestionar perros y solicitudes
- [ ] Profile - Editar perfil de usuario

**Nota:** Los componentes están generados y los servicios listos. Solo falta crear el HTML y conectar con los servicios.

## Seguridad

- [OK] Row Level Security (RLS) en Supabase
- [OK] Guards de autenticación
- [OK] Guards por rol (adoptante/rescatista)
- [OK] Validación de tipos de archivo
- [OK] CORS configurado

## Servicios Listos para Usar

Todos en `frontend/src/app/services/`:

```typescript
// AuthService - Gestión de autenticación
await authService.signUp(email, password, fullName, role);
await authService.signIn(email, password);

// DogService - CRUD de perros
await dogService.getAllDogs(filters);
await dogService.createDog(dogData, rescuerId);

// AdoptionService - Gestión de adopciones
await adoptionService.createAdoptionRequest(request, adopterId);
await adoptionService.updateAdoptionRequest(id, updates);

// UploadService - Upload de imágenes
await uploadService.uploadSingleImage(file);
```

## Próximos Pasos

1. **Configurar credenciales** (Supabase y Cloudinary)
2. **Iniciar ambos servidores** (frontend y backend)
3. **Probar login/registro** - Ya funciona completamente
4. **Implementar UI de los dashboards** - Servicios listos, falta HTML
5. **Opcional: Instalar Tailwind CSS** para estilos rápidos

## Ayuda

- **Supabase:** [Documentación](https://supabase.com/docs)
- **Angular:** [Guía oficial](https://angular.dev)
- **NestJS:** [Documentación](https://docs.nestjs.com)
- **Cloudinary:** [Docs de upload](https://cloudinary.com/documentation)

## Licencia

MIT

---

**El proyecto base está listo!**

Los fundamentos están implementados. Ahora solo necesitas:
1. Configurar las credenciales
2. Crear la UI de los componentes existentes
3. Empezar a adoptar perritos!
