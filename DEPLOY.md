# Guía de Deploy y Migración de Subidas a Cloudinary

Este documento complementa el README con pasos prácticos para producción.

## 1) Frontend en Vercel
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Output: `dist/`
- Env vars (Project Settings → Environment Variables):
  - `VITE_API_URL=https://tu-backend.onrender.com` (sin sufijo `/api`; el cliente lo agrega)
  - Si ves "Login – Vercel" y el `manifest.json` responde `401`, desactiva **Preview Protection** en Vercel o usa un dominio de producción público.

## 9) Despliegue por GitHub Actions (Vercel)

Este repo ya incluye workflows para desplegar el frontend en Vercel:

- `.github/workflows/deploy-frontend.yml` → Producción (push a `main` o `workflow_dispatch`)
- `.github/workflows/deploy-frontend-preview.yml` → Previews (PRs contra `main`)

### Requisitos en Vercel
- Crea el proyecto en Vercel apuntando a este repo.
- En `Project Settings → Environment Variables` define:
  - `VITE_API_URL` (Production y Preview): URL base pública del backend, sin `/api`.
- Opcional: desactiva **Preview Protection** para que las APIs puedan ser llamadas sin login Vercel.

### Secretos en GitHub (Actions)
En el repo: `Settings → Secrets and variables → Actions`, añade estos secretos:
- `VERCEL_TOKEN` → Token personal de Vercel.
- `VERCEL_ORG_ID` → ID de tu organización en Vercel.
- `VERCEL_PROJECT_ID` → ID del proyecto en Vercel.

Los workflows usan `working-directory: frontend` y la acción `amondnet/vercel-action@v25`, por lo que no necesitas modificar comandos.

### Disparar despliegues
- Producción: haz `push` a `main` o ejecuta el workflow manualmente (tab **Actions** → **Run workflow**).
- Preview: abre un Pull Request hacia `main`; el workflow publicará la URL de preview en el propio PR.

### Backend y CORS (necesario para que funcione en Vercel)
- En `backend/.env` configura:
  - `CORS_ORIGIN=https://tu-frontend.vercel.app` (puede ser lista separada por comas para multi-dominios)
  - `CORS_ORIGIN_PATTERNS=https://*.vercel.app` para permitir previews dinámicos
- Verifica el backend público (Render/Koyeb/Railway):
  - `GET /` → debe responder OK
  - `GET /api/_debug/routes` → lista las rutas

### Validaciones rápidas
- Abre la URL de Vercel y confirma que el login funciona y las páginas protegidas muestran datos.
- Si aparece `401` en llamadas XHR:
  - Revisa que el token JWT esté almacenado en `localStorage` y que el header `x-auth-token` se envíe.
  - Revisa CORS del backend (dominio Vercel y patrones). 
  - Confirma que `VITE_API_URL` apunte al backend correcto y sin `/api`.


## 2) Backend en Render/Railway
- Root Directory: `backend`
- Runtime: Node
- Start: `node index.js` (o `npm start` si configurado)
- Env vars:
  - `MONGO_URI` → MongoDB Atlas
  - `JWT_SECRET` → secreto fuerte
  - `CORS_ORIGIN` → URL de Vercel/Netlify (puede ser lista separada por comas)
  - Opcional `CORS_ORIGIN_PATTERNS` → patrones con comodines (ej: `https://*.vercel.app`) para permitir previews dinámicos
  - Opcional: `CLOUDINARY_URL` o `CLOUDINARY_*`

### Nota sobre Railway
Si tu cuenta muestra "Limited Access" y solo permite desplegar bases de datos, usa **Render** o **Koyeb** para el servicio de backend.

### Pasos en Render (alternativa gratuita)
1. Crea cuenta en https://render.com e inicia sesión con GitHub
2. New → Web Service → Selecciona `weapub/sj-empleados25`
3. Configuración:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Runtime: `Node`
4. Variables de entorno:
   - `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`
5. Despliega y toma la URL pública (ej: `https://<service>.onrender.com/`)
6. Pruebas rápidas:
   - `GET /` → debe responder `SJ-Empleados API OK`
   - `GET /api/_debug/routes` → lista de rutas

## 3) Base de datos en MongoDB Atlas
- Crea cluster (free tier).
- Añade usuario y IP whitelist.
- Copia la `MONGO_URI` al backend.

## 4) Migración de subidas a Cloudinary (recomendado)

### Por qué
- Render/Railway tienen filesystem efímero: se borra en redeploy o escala.
- Usa Cloudinary/S3 para persistencia y CDN.

### Setup
1. Crea cuenta en Cloudinary.
2. Obtén `cloud_name`, `api_key`, `api_secret`.
3. En `backend/.env` define:
   - `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`
   - o: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Instalación (local)
```
cd backend
npm i cloudinary multer multer-storage-cloudinary
```

### Configuración básica (ejemplo)

```js
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

```js
// middleware/upload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sj-empleados',
    allowed_formats: ['jpg', 'png', 'pdf'],
    resource_type: 'auto',
  },
});

const upload = multer({ storage });
module.exports = upload;
```

```js
// controllers/disciplinaryController.js (ejemplo de uso)
const upload = require('../middleware/upload');

// En tu ruta:
// router.post('/create', upload.single('file'), controller.create)

exports.create = async (req, res) => {
  try {
    const fileUrl = req.file?.path; // URL de Cloudinary
    // Guarda fileUrl en la DB en lugar de path local
    // ... lógica de creación
    res.json({ ok: true, fileUrl });
  } catch (e) {
    res.status(500).json({ message: 'Error al crear registro', error: e.message });
  }
};
```

### Consideraciones
- Elimina lógica que escriba en `backend/uploads/`.
- En DB guarda solo `fileUrl` y metadatos.
- Para borrar archivos, usa `cloudinary.uploader.destroy(public_id)`.

## 5) Seguridad y CORS
- En backend, CORS: permite solo el dominio del frontend (no `*`).
- No expongas secretos en frontend (`VITE_*` son públicos).

Multiorigen CORS:
```
CORS_ORIGIN=https://tu-frontend.vercel.app,https://otro-dominio.app
```
Si `CORS_ORIGIN` no está definido, el backend permite todas las solicitudes (útil para desarrollo).

Wildcards para previews (opcional):
```
CORS_ORIGIN_PATTERNS=https://*.vercel.app
```
Esto permite despliegues de vista previa en Vercel con subdominios variables sin tener que actualizar `CORS_ORIGIN` en cada deploy.

## 6) Pruebas post-deploy
- Frontend carga y ejecuta llamadas a backend.
- Backend responde y conecta con Atlas.
- Flujos de subida retornan URLs (no paths locales).

Endpoints de ejemplo (Render):
```
GET   https://<service>.onrender.com/
POST  https://<service>.onrender.com/api/auth/login
POST  https://<service>.onrender.com/api/auth/register
```

## 7) Rollout
- Usa ramas: `main` (producción), `dev` (desarrollo).
- Vercel/Render despliegan automáticamente los cambios en `main`.

## 8) Twilio (WhatsApp)
- El backend ya integra envíos automáticos de WhatsApp vía Twilio en:
  - Registro/actualización de asistencias (`attendanceController`) si el empleado tiene `telefono`.
  - Registro de medidas disciplinarias (`disciplinaryController`).
  - Recordatorios automáticos (`jobs/reminders`).

### Variables de entorno (backend)
Define en el servicio de backend (Render/Railway/Koyeb):
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```
- `TWILIO_WHATSAPP_NUMBER` debe usar el formato `whatsapp:+<numero>`. En sandbox suele ser `whatsapp:+14155238886`.

### Activar WhatsApp Sandbox (Twilio)
1. Ve a `Twilio Console → Messaging → Try it out → WhatsApp`. 
2. Sigue el “Join” del sandbox (envía `join <code>` al número de Twilio en WhatsApp desde el teléfono que recibirá mensajes).
3. Usa el número sandbox (`+14155238886`) como emisor con el prefijo `whatsapp:`.

### Formato de números
- El sistema normaliza números: si pones `1155555555` asumirá Argentina (+54) y lo convertirá a `whatsapp:+541155555555`.
- Se recomienda guardar `telefono` en DB con código país (`+54...`) para mayor precisión.

### Pruebas
- Crea una asistencia o una medida disciplinaria a un empleado con `telefono` y verifica que llegue el WhatsApp.
- Logs del backend mostrarán `[WHATSAPP MOCK]` si faltan credenciales; con credenciales correctas verás `sid` de Twilio.

### Producción
- Para salir del sandbox y usar un número propio de WhatsApp Business, debes verificar el número y completar el flujo de aprobación de Facebook/WhatsApp Business.

---
Cualquier ajuste adicional (S3, firma segura de uploads, validaciones extra) se puede incorporar si lo necesitas.