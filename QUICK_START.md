# Quick Start - AdoptaUnAmigo

## Inicio Rápido (5 minutos)

### 1. Configurar Supabase (2 min)

```bash
# 1. Ve a https://supabase.com
# 2. Crea nuevo proyecto
# 3. Ve a SQL Editor
# 4. Copia y ejecuta: database/schema.sql
# 5. Guarda tu URL y Anon Key
```

### 2. Configurar Cloudinary (1 min)

```bash
# 1. Ve a https://cloudinary.com
# 2. Regístrate gratis
# 3. Copia: Cloud Name, API Key, API Secret
```

### 3. Configurar Backend (1 min)

```bash
cd backend

# Crear .env
echo "SUPABASE_URL=TU_URL_AQUI" > .env
echo "SUPABASE_KEY=TU_KEY_AQUI" >> .env
echo "CLOUDINARY_CLOUD_NAME=TU_CLOUD_NAME" >> .env
echo "CLOUDINARY_API_KEY=TU_API_KEY" >> .env
echo "CLOUDINARY_API_SECRET=TU_API_SECRET" >> .env
echo "PORT=3000" >> .env

# Instalar y correr
npm install
npm run start:dev
```

Backend listo en: http://localhost:3000

### 4. Configurar Frontend (1 min)

```bash
cd frontend

# Editar manualmente: src/environments/environment.ts
# Reemplaza YOUR_SUPABASE_URL y YOUR_SUPABASE_ANON_KEY

# Instalar y correr
npm install
ng serve
```

Frontend listo en: http://localhost:4200

---

## Probar el Sistema

### 1. Registrarse

1. Ve a: http://localhost:4200
2. Click en "Regístrate aquí"
3. Elige:
   - **Adoptante**: Si quieres adoptar
   - **Rescatista**: Si vas a publicar perros
4. Completa el formulario
5. ¡Listo! Ya estás dentro

### 2. Como Rescatista

- Dashboard: http://localhost:4200/dashboard/rescatista
- Ver tus perros publicados
- Gestionar solicitudes de adopción

### 3. Como Adoptante

- Dashboard: http://localhost:4200/dashboard/adoptante
- Ver perros disponibles: http://localhost:4200/dogs
- Enviar solicitudes de adopción

---

## Variables de Entorno

### Backend (.env)

```env
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_KEY=tu-anon-key-aqui
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
PORT=3000
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://tuproyecto.supabase.co',
  supabaseKey: 'tu-anon-key-aqui',
  apiUrl: 'http://localhost:3000/api'
};
```

---

## Comandos Útiles

### Backend

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Tests
npm run test
```

### Frontend

```bash
# Desarrollo
ng serve
# o
npm start

# Producción
ng build --configuration production

# Tests
ng test
```

---

## Solución de Problemas

### Backend no inicia

```bash
# Verifica que .env existe
ls .env

# Verifica dependencias
npm install

# Verifica puerto 3000
netstat -an | findstr :3000
```

### Frontend no conecta

```bash
# Verifica environment.ts
cat src/environments/environment.ts

# Verifica que backend esté corriendo
curl http://localhost:3000
```

### Error de CORS

- Verifica que backend esté en puerto 3000
- Verifica `enableCors()` en `backend/src/main.ts`

### Error de Supabase

- Verifica URL y Key en ambos proyectos
- Verifica que ejecutaste schema.sql
- Verifica RLS policies en Supabase Dashboard

---

## Próximos Pasos

1. Sistema funcionando
2. Implementar UI de componentes (ver EJEMPLOS_CODIGO.md)
3. Instalar Tailwind CSS (opcional)
4. Empezar a agregar perros

---

## Documentación

- **Guía Completa**: GUIA_COMPLETA.md
- **Ejemplos de Código**: EJEMPLOS_CODIGO.md
- **Base de Datos**: database/README.md
- **Backend**: backend/SETUP.md

---

## Checklist de Configuración

- [ ] Proyecto Supabase creado
- [ ] Schema SQL ejecutado
- [ ] Cuenta Cloudinary creada
- [ ] Backend .env configurado
- [ ] Frontend environment.ts configurado
- [ ] Backend corriendo en :3000
- [ ] Frontend corriendo en :4200
- [ ] Login/Register funcionando
- [ ] Listo para desarrollar

---

**¿Problemas?** Revisa GUIA_COMPLETA.md para troubleshooting detallado.
