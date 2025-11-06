require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Disciplinary = require('../models/Disciplinary');
const PayrollReceipt = require('../models/PayrollReceipt');

async function connect() {
  if (process.env.VERCEL || String(process.env.NODE_ENV).toLowerCase() === 'production') {
    throw new Error('[SEED] Abortado: no ejecutar seedLocal en producción/Vercel.');
  }

  if (process.env.MONGO_URI) {
    console.warn('[SEED] Ignorando MONGO_URI para seedLocal: se usará siempre MongoDB en memoria.');
  }

  const memServer = await MongoMemoryServer.create();
  const memUri = memServer.getUri();
  await mongoose.connect(memUri);
  console.log(`[SEED] Conectado a MongoDB en memoria: ${memUri}`);
}

function yyyymm(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function run() {
  await connect();

  const reset = String(process.env.SEED_RESET || 'true').toLowerCase() !== 'false';
  if (reset) {
    console.log('[SEED] Limpiando colecciones relevantes...');
    await Attendance.deleteMany({});
    await Disciplinary.deleteMany({});
    await PayrollReceipt.deleteMany({});
    await Employee.deleteMany({});
  }

  console.log('[SEED] Creando empleados...');
  const [e1, e2, e3] = await Employee.create([
    {
      nombre: 'Juan', apellido: 'Pérez', dni: '12345678', email: 'juan.perez@test.com',
      puesto: 'Operario', departamento: 'Producción', salario: 350000, activo: true
    },
    {
      nombre: 'Ana', apellido: 'Gómez', dni: '23456789', email: 'ana.gomez@test.com',
      puesto: 'Administrativa', departamento: 'Administración', salario: 420000, activo: true
    },
    {
      nombre: 'Luis', apellido: 'Martínez', dni: '34567890', email: 'luis.martinez@test.com',
      puesto: 'Supervisor', departamento: 'Operaciones', salario: 500000, activo: true
    }
  ]);

  const today = new Date();
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

  console.log('[SEED] Creando asistencias (tardanzas e inasistencias)...');
  // Mes actual: 2 inasistencias, 3 tardanzas distribuidas
  await Attendance.create([
    { employee: e1._id, date: new Date(firstDayThisMonth.getTime() + 2*86400000), type: 'inasistencia', justified: false, lostPresentismo: true },
    { employee: e2._id, date: new Date(firstDayThisMonth.getTime() + 5*86400000), type: 'inasistencia', justified: true, lostPresentismo: true },
    { employee: e1._id, date: new Date(firstDayThisMonth.getTime() + 7*86400000), type: 'tardanza', justified: false, lateMinutes: 12, lostPresentismo: true, scheduledEntry: '08:00', actualEntry: '08:12' },
    { employee: e2._id, date: new Date(firstDayThisMonth.getTime() + 9*86400000), type: 'tardanza', justified: false, lateMinutes: 8, lostPresentismo: true, scheduledEntry: '08:00', actualEntry: '08:08' },
    { employee: e3._id, date: new Date(firstDayThisMonth.getTime() + 11*86400000), type: 'tardanza', justified: true, lateMinutes: 5, lostPresentismo: false, scheduledEntry: '08:00', actualEntry: '08:05' },
  ]);

  // Mes anterior: 1 inasistencia, 1 tardanza
  await Attendance.create([
    { employee: e1._id, date: new Date(endPrevMonth.getTime() - 5*86400000), type: 'inasistencia', justified: false, lostPresentismo: true },
    { employee: e2._id, date: new Date(endPrevMonth.getTime() - 3*86400000), type: 'tardanza', justified: false, lateMinutes: 10, lostPresentismo: true, scheduledEntry: '08:00', actualEntry: '08:10' },
  ]);

  console.log('[SEED] Creando medidas disciplinarias...');
  await Disciplinary.create([
    // Mes actual
    { employee: e1._id, date: new Date(firstDayThisMonth.getTime() + 6*86400000), time: '10:00', type: 'verbal', description: 'Llamado de atención por llegadas tarde', signed: true, signedDate: new Date(firstDayThisMonth.getTime() + 6*86400000) },
    { employee: e2._id, date: new Date(firstDayThisMonth.getTime() + 12*86400000), time: '09:30', type: 'formal', description: 'Apercibimiento por inasistencia injustificada', signed: false },
    // Mes anterior
    { employee: e3._id, date: new Date(endPrevMonth.getTime() - 10*86400000), time: '11:15', type: 'grave', description: 'Suspensión de 3 días', signed: true, signedDate: new Date(endPrevMonth.getTime() - 10*86400000), durationDays: 3,
      returnToWorkDate: new Date(endPrevMonth.getTime() - 7*86400000) },
  ]);

  console.log('[SEED] Creando recibos de sueldo...');
  const periodThis = yyyymm(today);
  const periodPrev = yyyymm(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  await PayrollReceipt.create([
    // Mes actual: uno sin firma para generar "recibos pendientes"
    { employee: e1._id, period: periodThis, paymentDate: new Date(firstDayThisMonth.getTime() + 20*86400000), signed: false, hasPresentismo: false, extraHours: 8, otherAdditions: 15000, discounts: 5000, advanceRequested: false, netAmount: 380000 },
    { employee: e2._id, period: periodThis, paymentDate: new Date(firstDayThisMonth.getTime() + 20*86400000), signed: true, signedDate: new Date(firstDayThisMonth.getTime() + 20*86400000), hasPresentismo: true, extraHours: 0, otherAdditions: 10000, discounts: 2000, advanceRequested: true, advanceDate: new Date(firstDayThisMonth.getTime() + 10*86400000), advanceAmount: 30000, netAmount: 410000 },
    { employee: e3._id, period: periodThis, paymentDate: new Date(firstDayThisMonth.getTime() + 20*86400000), signed: true, signedDate: new Date(firstDayThisMonth.getTime() + 20*86400000), hasPresentismo: true, extraHours: 12, otherAdditions: 0, discounts: 0, advanceRequested: false, netAmount: 520000 },
    // Mes anterior: todos firmados para delta de pendientes
    { employee: e1._id, period: periodPrev, paymentDate: new Date(endPrevMonth.getTime() - 3*86400000), signed: true, signedDate: new Date(endPrevMonth.getTime() - 3*86400000), hasPresentismo: false, extraHours: 4, otherAdditions: 8000, discounts: 3000, advanceRequested: false, netAmount: 360000 },
    { employee: e2._id, period: periodPrev, paymentDate: new Date(endPrevMonth.getTime() - 3*86400000), signed: true, signedDate: new Date(endPrevMonth.getTime() - 3*86400000), hasPresentismo: true, extraHours: 0, otherAdditions: 5000, discounts: 1000, advanceRequested: false, netAmount: 400000 },
    { employee: e3._id, period: periodPrev, paymentDate: new Date(endPrevMonth.getTime() - 3*86400000), signed: true, signedDate: new Date(endPrevMonth.getTime() - 3*86400000), hasPresentismo: true, extraHours: 10, otherAdditions: 0, discounts: 0, advanceRequested: false, netAmount: 510000 },
  ]);

  console.log('[SEED] Datos de ejemplo creados correctamente.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('[SEED] Error durante seed:', e);
  process.exit(1);
});