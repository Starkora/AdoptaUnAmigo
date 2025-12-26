# Instrucciones para configurar el backend

## 1. Crear archivo .env

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales:
- Supabase: Obtén la URL y Service Role Key desde tu proyecto
- Cloudinary: Regístrate en https://cloudinary.com y obtén tus credenciales

## 2. Instalar dependencias

```bash
npm install
```

## 3. Iniciar en desarrollo

```bash
npm run start:dev
```

El servidor estará disponible en: http://localhost:3000

## 4. Endpoints disponibles

### Cloudinary Upload
- POST `/api/upload` - Subir imagen a Cloudinary

### Dogs (protegido por Supabase RLS)
- Todos los endpoints usan Supabase directamente desde el frontend
- Este backend es opcional para funcionalidades adicionales

## Estructura

```
src/
├── app.module.ts       # Módulo principal
├── main.ts             # Entry point
└── upload/             # Módulo de upload de imágenes
    ├── upload.controller.ts
    ├── upload.service.ts
    └── upload.module.ts
```
