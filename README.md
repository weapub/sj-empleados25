# SJ Empleados 25 – Deploy y Configuración

Proyecto monorepo con `frontend/` (React + Bootstrap) y `backend/` (Node/Express + MongoDB).

## URL de Producción
- Frontend: `https://sj-empleados.vercel.app/`

## Subir a GitHub (repo: `weapub/sj-empleados25`)

1. Inicializa repo:
   - `git init`
   - `git add .`
   - `git commit -m "Inicial"`
   - `git branch -M main`
   - `git remote add origin https://github.com/weapub/sj-empleados25.git`
   - `git push -u origin main`
2. Asegúrate de no subir secretos:
   - `backend/.env` (usa `backend/.env.example`)
   - `backend/uploads/`
   - `node_modules/`

## Variables de entorno

### Backend (`backend/.env`)
- `PORT`: opcional (Render/Railway lo definen)
- `MONGO_URI`: conexión MongoDB Atlas
- `JWT_SECRET`: secreto para Auth
- `CORS_ORIGIN`: URL pública del frontend (ej. `https://tuapp.vercel.app`)
- `CLOUDINARY_URL` o (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), opcional para almacenamiento de archivos

Ejemplo: ver `backend/.env.example`.

### Frontend (`frontend/.env`)
- `VITE_API_URL`: URL pública del backend (ej. `https://tu-api.onrender.com`)

Ejemplo: ver `frontend/.env.example`.

## Deploy recomendado

### Frontend (Vercel)
- Importa el repo desde GitHub.
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Output: `dist/`
- Configura vars: `VITE_API_URL` apuntando al backend.

Checklist de producción (Vercel):
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variables: `VITE_API_URL` → backend público
- Dominio de producción: `https://sj-empleados.vercel.app/` (si aplica)

### Backend (Render o Railway)
- Crea un servicio web desde el repo.
- Root Directory: `backend`
- Runtime: Node
- Start: `node index.js` (o `npm start` si lo defines)
- Variables: `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, opcional Cloudinary.
- Base de datos: MongoDB Atlas (free tier).

### Almacenamiento de archivos
- Evita filesystem local en producción (`backend/uploads/`). Usa Cloudinary o S3.
- Guarda en DB solo los URLs resultantes.

## CORS y rutas
- En backend habilita CORS con `CORS_ORIGIN` (dominio del frontend).
- En frontend ajusta `VITE_API_URL` al dominio público del backend.

---

## Publicación en GitHub (Guía rápida)

Para subir este proyecto a GitHub sin exponer configuraciones locales o datos de prueba:

- Asegúrate de NO commitear archivos de entorno reales:
  - Frontend: usa `frontend/.env.example` y evita subir `frontend/.env.development` y `frontend/.env.production`.
  - Backend: usa `backend/.env.example` y no subas `backend/.env`.
- Verifica que `.gitignore` ignore `node_modules/`, artefactos de build (`dist/`, `build/`), `uploads/` del backend, y archivos `.env`.
- Elimina datos de prueba (ya removidos): `test-login.json`, `test-register.json`, `employee.json`.
- Documenta en el README cómo configurar variables usando los archivos `*.env.example`.

### Configuración local (desarrollo)
- Backend: crea `backend/.env` con `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`.
- Frontend: crea `frontend/.env` o `frontend/.env.development` con `VITE_API_URL` apuntando al backend (ej. `http://localhost:5000`).
- Instalación: `npm install` en `backend/` y `frontend/`.
- Ejecución: `npm start` en backend y `npm run dev` en frontend.
- Puerto de desarrollo del frontend: `http://localhost:5178/` (configurado con `strictPort`).

### Ejecución en Red Local (para pruebas en móviles)
1. Obtén tu IP local (ej. `192.168.1.50` vía `ipconfig`).
2. **Backend**: En `backend/.env`, establece `CORS_ORIGIN=http://192.168.1.50:5178`.
3. **Frontend**: En `frontend/.env`, establece `VITE_API_URL=http://192.168.1.50:5000`.
4. **Comando Frontend**: Ejecuta `npm run dev -- --host` en la carpeta `frontend/`.
5. Accede desde tu móvil usando `http://192.168.1.50:5178`.

### Producción
- No subas `.env` al repo; configura variables en el proveedor (Render/Railway/Vercel).
- Frontend se construye con `vite build` (`frontend/`), backend se inicia con `node index.js` o `npm start` (`backend/`).

## CI/CD (opcional)
- Conecta Vercel y Render/Railway al repo: desplegarán automáticamente en cada push a `main`.
- Si quieres pruebas antes del deploy, agrega un workflow de GitHub Actions para `frontend` y `backend`.

### CI/CD y Deploy (Actions)
- Workflows incluidos:
  - `.github/workflows/ci.yml`: build del frontend (Vite) e instalación del backend.
  - `.github/workflows/deploy-frontend.yml`: deploy del frontend a Vercel.
  - `.github/workflows/deploy-backend.yml`: redeploy del servicio backend en Render.
  - `.github/workflows/deploy-frontend-preview.yml`: deploy de preview a Vercel en PRs hacia `main`.
- Secrets requeridos en GitHub → Actions:
  - Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
  - Render: `RENDER_API_KEY`, `RENDER_SERVICE_ID`.
- Configura variables de entorno en cada proveedor:
  - Frontend (Vercel): `VITE_API_URL` apuntando al backend público.
  - Backend (Render): `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, Cloudinary/Twilio si aplica.

### Deploy Preview
- Al abrir un Pull Request hacia `main`, se generará un deployment de preview en Vercel.
- El workflow comenta automáticamente en el PR el URL de la preview.
 
### Virtualización de listas en móviles (v0.1.0)
- Se retiró `react-window` de la vista móvil de asistencia (`frontend/src/components/attendance/AttendanceList.jsx`) para evitar el error de build `[MISSING_EXPORT] FixedSizeList` con `rolldown/vite`.
- En móvil ahora se renderiza con `Array.map`. Si necesitas virtualización por rendimiento, usa una librería ESM-friendly como `@tanstack/react-virtual`.
- Nota histórica: con `react-window` era necesario pasar `width` numérico en `FixedSizeList` para evitar `TypeError: Object.values is not a function` en móviles; desde `v0.1.0` se eliminó su uso en móvil.
- Referencias: ver `CHANGELOG.md` (v0.1.0) y la sección "Release v0.1.0 (Frontend)" en `DEPLOY.md`.

## Notas
- No subas archivos reales a `backend/uploads/`. Está ignorado por `.gitignore`.
- Usa `.env.example` como referencia para crear tus `.env` locales y de producción.