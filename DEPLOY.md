# Guía de Deploy y Migración de Subidas a Cloudinary

Este documento complementa el README con pasos prácticos para producción.

## 1) Frontend en Vercel
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Output: `build/`
- Env vars (Project Settings → Environment Variables):
  - `REACT_APP_API_URL=https://tu-backend.onrender.com`

## 2) Backend en Render/Railway
- Root Directory: `backend`
- Runtime: Node
- Start: `node index.js` (o `npm start` si configurado)
- Env vars:
  - `MONGO_URI` → MongoDB Atlas
  - `JWT_SECRET` → secreto fuerte
  - `CORS_ORIGIN` → URL de Vercel/Netlify (puede ser lista separada por comas)
  - Opcional: `CLOUDINARY_URL` o `CLOUDINARY_*`

### Nota sobre Railway
Si tu cuenta muestra "Limited Access" y solo permite desplegar bases de datos, usa **Render** o **Koyeb** para el servicio de backend.

### Pasos en Render (alternativa gratuita)
1. Crea cuenta en https://render.com e inicia sesión con GitHub
2. New → Web Service → Selecciona `weapub/sj-empleados-system`
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
- No expongas secretos en frontend (`REACT_APP_*` son públicos).

Multiorigen CORS:
```
CORS_ORIGIN=https://tu-frontend.vercel.app,https://otro-dominio.app
```
Si `CORS_ORIGIN` no está definido, el backend permite todas las solicitudes (útil para desarrollo).

## 6) Pruebas post-deploy
- Frontend carga y ejecuta llamadas a backend.
- Backend responde y conecta con Atlas.
- Flujos de subida retornan URLs (no paths locales).

## 7) Rollout
- Usa ramas: `main` (producción), `dev` (desarrollo).
- Vercel/Render despliegan automáticamente los cambios en `main`.

---
Cualquier ajuste adicional (S3, firma segura de uploads, validaciones extra) se puede incorporar si lo necesitas.