# SJ-Empleados — Dossier de Funciones para Empresas

Una plataforma completa para gestionar empleados, asistencias, comunicaciones y documentación, lista para adopción rápida en tu organización.

## Resumen Ejecutivo
- Frontend en `https://sj-empleados.vercel.app/` (Vercel).
- Backend Node/Express y MongoDB Atlas (Render/Railway/Koyeb).
- Envío de Presentismo por WhatsApp con selector de mes y destinatario.
- CI/CD listo y documentación de despliegue e instalación para otras entidades.

## Funciones Principales
- Autenticación y seguridad
  - Login con JWT, protección de rutas y cierre de sesión.
- Gestión de empleados
  - Alta, edición, baja y consulta. Datos personales y estado laboral.
- Asistencias
  - Registro, edición y consulta diaria/mensual con filtros y orden.
  - Experiencia móvil estable y ágil.
- Medidas disciplinarias
  - Alta/edición con adjuntos (Cloudinary). Notificación opcional por WhatsApp.
- Recibos y cuenta del empleado
  - Consulta de recibos (PDFs) y movimientos de cuenta.
- Dashboard y métricas
  - Accesos rápidos a flujos críticos y panel de indicadores.
- Presentismo por WhatsApp
  - Modal con selector de mes y “Actualizar previsualización”.
  - Selector de destinatario (BD o `PRESENTISMO_WHATSAPP_TO`).
  - Apertura de `wa.me` con número elegido y texto autogenerado.
- Administración de destinatarios de Presentismo
  - Carga/edición con nombre, rol y teléfono. Integración directa en el modal.
- Eventos del empleado
  - Gestión de eventos laborales (altas, licencias, cambios).
- Búsqueda y filtros
  - Filtros y orden en listados, consistente en escritorio y móvil.

## Automatizaciones e Integraciones
- WhatsApp
  - Apertura directa desde el frontend (`wa.me`).
  - Envíos automáticos backend por Twilio (opt-in) en asistencias/disciplinarias.
- Subidas y adjuntos
  - Cloudinary para almacenamiento persistente y CDN.
- CI/CD
  - Workflows de GitHub Actions para deploy de frontend producción y previews; redeploy backend.
- API pública
  - Endpoints REST con CORS configurables para multi-origen.

## Seguridad
- JWT con middleware de autorización en endpoints sensibles.
- CORS configurable
  - `CORS_ORIGIN` para dominios permitidos.
  - `CORS_ORIGIN_PATTERNS` para previews (`https://*.vercel.app`).
- Manejo de secretos
  - Frontend usa `VITE_*` (públicos). Secretos en backend y proveedores.

## Experiencia de Usuario
- Responsive y accesible.
- Modal de Presentismo
  - Mes por defecto: actual (`YYYY-MM`).
  - Destinatarios legibles (nombre, rol, teléfono).
  - Advertencias si no hay destinatarios configurados.

## Configuración y Personalización
- Branding ajustable en `frontend/public/`.
- Variables de entorno:
  - Frontend: `VITE_API_URL` → backend.
  - Backend: `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, opcionales Cloudinary/Twilio.
- Desarrollo
  - Frontend en `http://localhost:5178/` con `strictPort`.
- Producción
  - Dominio: `https://sj-empleados.vercel.app/`.

## Reportes y Comunicaciones
- Presentismo por WhatsApp
  - Texto autogenerado por mes y destinatario. Apertura inmediata de `wa.me`.
- Adjuntos
  - PDF/imagen alojados en Cloudinary.

## Operaciones
- Recordatorios automáticos (`backend/jobs/reminders.js`).
- Scripts de administración (`backend/scripts/`): promoción de admin, migraciones, seed.

## Tecnología y Arquitectura
- Frontend: React + Vite + Tailwind/Bootstrap.
- Backend: Node.js + Express.
- Base de datos: MongoDB Atlas.
- Integración opcional con Twilio para WhatsApp Business.
- Infraestructura de deploy lista con Vercel/Render/Koyeb y GitHub Actions.

## Requisitos de Adopción
- Backend accesible públicamente (Render/Railway/Koyeb).
- MongoDB Atlas (free tier suficiente).
- Frontend en Vercel con `VITE_API_URL` apuntando al backend.
- CORS configurado para el dominio público del frontend.
- Destinatarios de Presentismo cargados en Administración.

## Implementación Rápida
- Guía de instalación para otras entidades: `docs/instalacion-otras-entidades.md`.
- Guía de deploy detallada: `DEPLOY.md`.
- Release listo con artefacto: tag `v0.2.2` y `dist.zip` del frontend (workflow automático).

## Diferenciales
- Flujo de Presentismo por WhatsApp listo, simple y confiable.
- Despliegue inmediato con proveedores mainstream (Vercel/Render).
- Enfoque móvil y operación diaria.
- Extensible: controladores y modelos modulares.

## Opciones de Implementación
- Solo frontend (integración con backend existente).
- Paquete completo (frontend + backend + DB).
- Twilio opcional (sandbox y Business).
- Almacenamiento en Cloudinary o S3.

## Capturas y Diagramas
- Diagrama de flujo: `docs/diagrama-de-flujo.md`.
- Logos y recursos: `frontend/public/`.
- Capturas sugeridas: Dashboard, Modal de Presentismo, Asistencias (móvil), Administración de destinatarios.

## Conversión a PDF
- Podés exportar este fichero a PDF con:
  - “Print to PDF” desde GitHub (vista cruda con estilos del navegador), o
  - Pandoc: `pandoc -f gfm -t pdf docs/folleto-empresas.md -o folleto-empresas.pdf`.

---
Para una demo o presentación, podemos preparar datos de prueba y ajustar el branding/tonos del mensaje de Presentismo a tu organización.