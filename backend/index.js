require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const compression = require('compression');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const disciplinaryRoutes = require('./routes/disciplinaryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const eventRoutes = require('./routes/eventRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const accountRoutes = require('./routes/accountRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reminders = require('./jobs/reminders');
const User = require('./models/User');

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOriginPatterns = (process.env.CORS_ORIGIN_PATTERNS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  // Si no hay restricciones, permitir todo
  if (allowedOrigins.length === 0 && allowedOriginPatterns.length === 0) return true;
  // Coincidencia exacta
  if (allowedOrigins.includes(origin)) return true;
  // Patrones con comodines (ej: https://*.vercel.app)
  return allowedOriginPatterns.some((pattern) => {
    if (!pattern) return false;
    // Convertir '*' en '.*' y escapar puntos
    const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
    try {
      const regex = new RegExp(regexStr);
      return regex.test(origin);
    } catch (_) {
      return false;
    }
  });
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (same-origin, curl, health checks)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
    optionsSuccessStatus: 204,
  })
);

// Parsear cuerpos application/x-www-form-urlencoded además de JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Comprimir respuestas para reducir tamaño de transferencia
app.use(compression());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/disciplinary', disciplinaryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payroll', payrollRoutes);
console.log('[Routes] Mounting account routes:', !!accountRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);

// Debug: list registered routes
app.get('/api/_debug/routes', (req, res) => {
  try {
    const routes = [];
    app?._router?.stack?.forEach((middleware) => {
      if (middleware?.route) {
        const methods = Object.keys(middleware.route.methods || {}).join(',');
        routes.push(`${methods} ${middleware.route.path}`);
      } else if (middleware?.name === 'router' && middleware?.handle?.stack) {
        middleware.handle.stack.forEach((handler) => {
          if (handler?.route) {
            const methods = Object.keys(handler.route.methods || {}).join(',');
            routes.push(`[router] ${methods} ${handler.route.path}`);
          }
        });
      }
    });
    res.json({ routes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Healthcheck básico en raíz
app.get('/', (req, res) => {
  res.send('SJ-Empleados API OK');
});

// DB Connection con fallback en memoria para desarrollo
async function startServer() {
  const port = process.env.PORT || 5000;
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/empleados_db';
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log(`[DB] Conectado a MongoDB: ${mongoUri}`);
  } catch (err) {
    console.error('[DB] Error conectando a MongoDB local:', err.message);
    console.log('[DB] Iniciando MongoDB en memoria (solo desarrollo)');
    const memServer = await MongoMemoryServer.create();
    const memUri = memServer.getUri();
    await mongoose.connect(memUri);
    console.log(`[DB] Conectado a MongoDB en memoria: ${memUri}`);
  }
  // Seed de usuario admin por defecto (solo si está habilitado)
  await seedDefaultAdmin();
  // Iniciar cron y servidor
  const remindersEnabled = String(process.env.REMINDERS_ENABLED || 'true').toLowerCase() !== 'false';
  if (remindersEnabled) {
    reminders.start();
  } else {
    console.log('[CRON] Recordatorios automáticos deshabilitados por configuración (REMINDERS_ENABLED=false)');
  }
  app.listen(port, () => {
    console.log(`[API] Servidor escuchando en puerto ${port}`);
  });
}

startServer();

// Crear usuario admin por defecto si no existe
async function seedDefaultAdmin() {
  try {
    const enabled = String(process.env.SEED_DEFAULT_USER || 'true').toLowerCase() !== 'false';
    if (!enabled) {
      console.log('[SEED] Seed de usuario por defecto deshabilitado (SEED_DEFAULT_USER=false)');
      return;
    }
    const email = process.env.ADMIN_SEED_EMAIL || 'admin@test.com';
    const password = process.env.ADMIN_SEED_PASSWORD || '123456';
    const nombre = process.env.ADMIN_SEED_NAME || 'Admin';
    const role = process.env.ADMIN_SEED_ROLE || 'admin';
    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`[SEED] Usuario por defecto ya existe: ${email}`);
      return;
    }
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ nombre, email, password: hashed, role });
    await user.save();
    console.log(`[SEED] Usuario por defecto creado: ${email} / ${password}`);
  } catch (e) {
    console.error('[SEED] Error creando usuario por defecto:', e.message);
  }
}