# Configuración de Notificaciones por Email

Este documento explica cómo configurar las notificaciones por correo electrónico en AdoptaUnAmigo.

## Requisitos

Las notificaciones por email se envían en los siguientes casos:

### Para Rescatistas:
- Nueva solicitud de adopción
- Adopción cancelada por el adoptante
- Nuevos mensajes en el chat

### Para Adoptantes:
- Solicitud de adopción aprobada
- Nuevos mensajes en el chat

## Configuración con Gmail

### 1. Crear una Contraseña de Aplicación en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Navega a **Seguridad**
3. En "Cómo inicias sesión en Google", selecciona **Verificación en dos pasos** (actívala si no está activada)
4. Una vez activada, busca **Contraseñas de aplicaciones** en la parte inferior
5. Selecciona la aplicación: **Correo** y el dispositivo: **Otro (nombre personalizado)**
6. Escribe "AdoptaUnAmigo" y haz clic en **Generar**
7. Copia la contraseña de 16 caracteres generada

### 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env` en el backend:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación-de-16-caracteres

# Frontend URL (para los enlaces en los correos)
FRONTEND_URL=https://tu-dominio.vercel.app
```

### 3. Configurar en Vercel

Si estás desplegando en Vercel, agrega estas variables de entorno en la configuración del proyecto:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable:
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `FRONTEND_URL`

## Configuración con Otros Proveedores

### Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña
```

### Yahoo

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=tu-email@yahoo.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
```

### SendGrid (Recomendado para Producción)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=tu-api-key-de-sendgrid
```

## Implementación en Supabase

Para que las notificaciones se envíen automáticamente, necesitas crear funciones serverless que llamen al backend cuando ocurran eventos.

### Database Webhook en Supabase

1. Ve a tu proyecto en Supabase
2. Database → Webhooks
3. Crea webhooks para:
   - Nueva solicitud de adopción: `adoption_requests` (INSERT)
   - Aprobación de adopción: `adoption_requests` (UPDATE)
   - Cancelación de adopción: `adoption_requests` (UPDATE)
   - Nuevo mensaje: `messages` (INSERT)

### Ejemplo de Función Edge en Supabase

Crea una función Edge en Supabase que se ejecute con cada webhook:

```typescript
// supabase/functions/notify-adoption/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { record, type } = await req.json()
  
  // Llamar a tu backend para enviar el email
  await fetch(`${Deno.env.get('BACKEND_URL')}/api/notifications/adoption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record, type })
  })
  
  return new Response('OK', { status: 200 })
})
```

## Pruebas

Para probar el envío de correos en desarrollo:

1. Asegúrate de tener las variables de entorno configuradas
2. Inicia el backend: `npm run start:dev`
3. Crea una solicitud de adopción desde el frontend
4. Verifica que llegue el correo al rescatista

## Solución de Problemas

### El correo no se envía

1. Verifica que las credenciales en `.env` sean correctas
2. Revisa que la contraseña de aplicación de Gmail esté bien copiada (sin espacios)
3. Asegúrate de que la verificación en dos pasos esté activada en Gmail
4. Revisa los logs del backend para ver errores específicos

### Los correos llegan a spam

1. Configura SPF, DKIM y DMARC en tu dominio (solo para producción con dominio propio)
2. Usa un servicio profesional como SendGrid o Amazon SES para producción
3. Evita palabras como "gratis", "urgente" en los asuntos

### Rate Limits de Gmail

Gmail tiene límites de envío:
- 500 correos por día para cuentas personales
- 2000 correos por día para cuentas de Google Workspace

Para mayor volumen, considera usar:
- **SendGrid** (100 correos/día gratis)
- **Amazon SES** (62,000 correos/mes gratis)
- **Mailgun** (5,000 correos/mes gratis)

## Personalización de Templates

Los templates de correo están en `backend/src/email/email.service.ts`. Puedes personalizarlos editando el HTML de cada método.

## Seguridad

**IMPORTANTE:**
- Nunca subas el archivo `.env` con credenciales reales a GitHub
- Usa contraseñas de aplicación, no tu contraseña principal de email
- En producción, usa servicios especializados de email
- Mantén actualizadas las dependencias de seguridad

## Monitoreo

Para monitorear el envío de correos:

1. Revisa los logs del backend
2. Implementa logging en el `EmailService`
3. Usa servicios como Sentry para capturar errores
4. Configura alertas si muchos correos fallan

## Recursos Adicionales

- [Documentación de Nodemailer](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
