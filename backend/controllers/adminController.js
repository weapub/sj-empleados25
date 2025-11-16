const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Disciplinary = require('../models/Disciplinary');
const Employee = require('../models/Employee');
const { cloudinary, extractPublicIdFromUrl } = require('../utils/cloudinary');
const https = require('https');
const http = require('http');
const { sendWhatsApp } = require('../utils/whatsapp');
// Utilidad simple para formatear el mes en español
function formatMonthLongYear(date) {
  try {
    return date.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
  } catch (_) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${m}/${y}`;
  }
}
function formatMonthYYYYMM(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Informe mensual de presentismo: empleados que perdieron por inasistencia
function buildPresentismoReportMessage(monthDate, employees) {
  const label = formatMonthLongYear(monthDate);
  const header = `Informe de Presentismo – ${label}`;
  const sub = `Empleados que perdieron el presentismo por inasistencias:`;
  if (!employees || employees.length === 0) {
    return `${header}\n${sub}\n\nNo se registran pérdidas de presentismo por inasistencia en el período.`;
  }
  const lines = employees.map((e, idx) => {
    const dni = e.dni ? String(e.dni) : '-';
    const tel = e.telefono ? String(e.telefono) : '-';
    return `${idx + 1}. ${e.apellido} ${e.nombre} – DNI ${dni} – Tel ${tel}`;
  });
  return `${header}\n${sub}\n\n${lines.join('\n')}`;
}

// POST /api/admin/presentismo/report/send
// Opcional: body { month: 'YYYY-MM' } para enviar un mes específico
exports.sendPresentismoMonthlyReport = async (req, res) => {
  try {
    // Solo admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }

    // Determinar mes objetivo
    const rawMonth = (req.body?.month || req.query?.month || '').trim();
    let startDate;
    if (rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)) {
      const [y, m] = rawMonth.split('-').map((v) => Number(v));
      startDate = new Date(y, m - 1, 1);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    // Buscar empleados con inasistencias que pierdan presentismo en el mes
    const Attendance = require('../models/Attendance');
    const Employee = require('../models/Employee');
    const employeeIds = await Attendance.distinct('employee', {
      type: 'inasistencia',
      lostPresentismo: true,
      date: { $gte: startDate, $lt: endDate }
    });

    const employees = await Employee.find({ _id: { $in: employeeIds } }).select('nombre apellido dni telefono');
    const message = buildPresentismoReportMessage(startDate, employees);

    // Destinatarios desde BD (fallback a env si no hay ninguno)
    const PresentismoRecipient = require('../models/PresentismoRecipient');
    const dbRecipientsDocs = await PresentismoRecipient.find({ active: true }).select('name roleLabel phone').lean();
    const dbRecipients = dbRecipientsDocs.map((r) => (r.phone || '').trim()).filter(Boolean);
    const envRecipients = (process.env.PRESENTISMO_WHATSAPP_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
    const rawRecipients = dbRecipients.length > 0 ? dbRecipients : envRecipients;
    const recipients = dbRecipients.length > 0
      ? dbRecipientsDocs.map(r => ({ phone: String(r.phone || '').trim(), name: r.name || null, roleLabel: r.roleLabel || null }))
      : envRecipients.map(p => ({ phone: p, name: null, roleLabel: null }));
    if (rawRecipients.length === 0) {
      return res.status(400).json({
        msg: 'No hay destinatarios configurados (BD o env) para el informe',
        hint: 'Configure destinatarios en el panel o setee PRESENTISMO_WHATSAPP_TO'
      });
    }

    const results = [];
    let sent = 0;
    let errors = 0;
    for (const to of rawRecipients) {
      try {
        const r = await sendWhatsApp(to, message);
        if (r?.sid || r?.mock) {
          sent += 1;
          results.push({ to, ...(r.sid ? { sid: r.sid } : { mock: true }) });
        } else {
          errors += 1;
          results.push({ to, error: r?.error || 'unknown_error' });
        }
      } catch (e) {
        errors += 1;
        results.push({ to, error: e.message });
      }
    }

    return res.json({
      msg: 'Informe de presentismo enviado',
      month: formatMonthYYYYMM(startDate),
      totalEmployees: employees.length,
      destinations: rawRecipients.length,
      sent,
      errors,
      results,
      source: dbRecipients.length > 0 ? 'db' : 'env'
    });
  } catch (e) {
    console.error('[Admin] sendPresentismoMonthlyReport error:', e);
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

// POST /api/admin/presentismo/report/preview
// Opcional: body { month: 'YYYY-MM' } para generar el mensaje y listado sin enviar
exports.previewPresentismoMonthlyReport = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }

    // Determinar mes objetivo
    const rawMonth = (req.body?.month || req.query?.month || '').trim();
    let startDate;
    if (rawMonth && /^\d{4}-\d{2}$/.test(rawMonth)) {
      const [y, m] = rawMonth.split('-').map((v) => Number(v));
      startDate = new Date(y, m - 1, 1);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    // Buscar empleados con inasistencias que pierdan presentismo en el mes
    const Attendance = require('../models/Attendance');
    const Employee = require('../models/Employee');
    const employeeIds = await Attendance.distinct('employee', {
      type: 'inasistencia',
      lostPresentismo: true,
      date: { $gte: startDate, $lt: endDate }
    });

    const employees = await Employee.find({ _id: { $in: employeeIds } }).select('nombre apellido dni telefono').lean();
    const message = buildPresentismoReportMessage(startDate, employees);

    // Incluir destinatarios activos (o fallback a env) para que el frontend pueda abrir WhatsApp
    const PresentismoRecipient = require('../models/PresentismoRecipient');
    const dbRecipientsDocs = await PresentismoRecipient.find({ active: true }).select('phone').lean();
    const dbRecipients = dbRecipientsDocs.map((r) => (r.phone || '').trim()).filter(Boolean);
    const envRecipients = (process.env.PRESENTISMO_WHATSAPP_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
    const rawRecipients = dbRecipients.length > 0 ? dbRecipients : envRecipients;

    return res.json({
      msg: 'Previsualización del informe de presentismo',
      month: formatMonthYYYYMM(startDate),
      totalEmployees: employees.length,
      employees: employees.map((e) => ({ nombre: e.nombre, apellido: e.apellido })),
      message,
      destinations: rawRecipients, // lista de números configurados (compat)
      recipients, // objetos con { phone, name, roleLabel }
      source: dbRecipients.length > 0 ? 'db' : 'env'
    });
  } catch (e) {
    console.error('[Admin] previewPresentismoMonthlyReport error:', e);
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

// CRUD destinatarios de Presentismo
exports.getPresentismoRecipients = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }
    const PresentismoRecipient = require('../models/PresentismoRecipient');
    const list = await PresentismoRecipient.find().sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

exports.createPresentismoRecipient = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }
    const PresentismoRecipient = require('../models/PresentismoRecipient');
    const { name = '', roleLabel = '', phone = '', active = true } = req.body || {};
    const trimmedPhone = String(phone || '').trim();
    if (!trimmedPhone) {
      return res.status(400).json({ msg: 'El teléfono es requerido' });
    }
    const doc = await PresentismoRecipient.create({ name, roleLabel, phone: trimmedPhone, active: Boolean(active), createdBy: req.user?._id });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

exports.updatePresentismoRecipient = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }
    const PresentismoRecipient = require('../models/PresentismoRecipient');
    const id = req.params.id;
    const { name, roleLabel, phone, active } = req.body || {};
    const update = {};
    if (typeof name !== 'undefined') update.name = name;
    if (typeof roleLabel !== 'undefined') update.roleLabel = roleLabel;
    if (typeof phone !== 'undefined') update.phone = String(phone || '').trim();
    if (typeof active !== 'undefined') update.active = Boolean(active);
    const doc = await PresentismoRecipient.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ msg: 'Destinatario no encontrado' });
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

exports.deletePresentismoRecipient = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }
    const PresentismoRecipient = require('../models/PresentismoRecipient');
    const id = req.params.id;
    const doc = await PresentismoRecipient.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ msg: 'Destinatario no encontrado' });
    return res.json({ msg: 'Eliminado', id });
  } catch (e) {
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

// Dev-only: promover usuario a admin por email, protegido por token y entorno no producción
exports.promoteAdminByEmailDev = async (req, res) => {
  try {
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    if (isProd) {
      return res.status(403).json({ msg: 'Deshabilitado en producción' });
    }
    const token = req.headers['x-admin-promote-token'] || '';
    const expected = process.env.ADMIN_PROMOTE_TOKEN || 'DEV_PROMOTE';
    if (!token || token !== expected) {
      return res.status(401).json({ msg: 'Token inválido' });
    }
    const email = String((req.body?.email || req.query?.email || '')).trim();
    const passwordRaw = (req.body?.password || req.query?.password);
    const password = passwordRaw ? String(passwordRaw) : null;
    const name = String((req.body?.name || req.query?.name || '')).trim();
    if (!email) {
      return res.status(400).json({ msg: 'Email requerido' });
    }
    const User = require('../models/User');
    let user = await User.findOne({ email });
    if (!user) {
      const nombre = name || 'Admin';
      const rawPassword = password || process.env.ADMIN_SEED_PASSWORD || '123456';
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(rawPassword, salt);
      user = new User({ nombre, email, password: hashed, role: 'admin' });
      await user.save();
      return res.json({ msg: 'Usuario creado y promovido a admin', email, created: true, password: rawPassword });
    }
    user.role = 'admin';
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    return res.json({ msg: 'Usuario promovido a admin', email, created: false });
  } catch (e) {
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

// Obtener content-type via HEAD; si falla, intentar GET rápido sin cuerpo completo
const getContentType = (url) => new Promise((resolve) => {
  try {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.headers['content-type'] || '');
    });
    req.on('error', () => {
      // Fallback GET
      const reqGet = lib.request(url, { method: 'GET' }, (res) => {
        resolve(res.headers['content-type'] || '');
        res.destroy();
      });
      reqGet.on('error', () => resolve(''));
      reqGet.end();
    });
    req.end();
  } catch (_) {
    resolve('');
  }
});

const mapMimeToFormat = (mime) => {
  const m = (mime || '').toLowerCase();
  if (m.includes('application/pdf')) return 'pdf';
  if (m.includes('application/msword')) return 'doc';
  if (m.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
  return null;
};

const hasKnownExtension = (url) => /\.(pdf|doc|docx)(\?|$)/i.test(url || '');
const isRawUploadUrl = (url) => (url || '').includes('/raw/upload/');

async function fixUrl(url) {
  if (!url || !isRawUploadUrl(url) || hasKnownExtension(url)) return null; // nada que hacer
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return null;

  const mime = await getContentType(url);
  const format = mapMimeToFormat(mime);
  if (!format) return null; // desconocido, omitir

  try {
    const result = await cloudinary.v2.uploader.upload(url, {
      resource_type: 'raw',
      type: 'upload',
      public_id: publicId, // incluye carpeta
      format,
      overwrite: true,
    });
    return result.secure_url || result.url || null;
  } catch (e) {
    console.error('[AdminMigration] Error re-subiendo a Cloudinary:', e.message);
    return null;
  }
}

exports.migrateRawFormats = async (req, res) => {
  try {
    // Solo admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }

    const summary = {
      attendance: { scanned: 0, updated: 0 },
      disciplinary: { scanned: 0, updated: 0 },
    };

    // Procesar Attendance
    const attends = await Attendance.find({ justificationDocument: { $ne: null } });
    for (const item of attends) {
      summary.attendance.scanned += 1;
      const newUrl = await fixUrl(item.justificationDocument);
      if (newUrl && newUrl !== item.justificationDocument) {
        item.justificationDocument = newUrl;
        await item.save();
        summary.attendance.updated += 1;
      }
    }

    // Procesar Disciplinary
    const discs = await Disciplinary.find({ document: { $ne: null } });
    for (const d of discs) {
      summary.disciplinary.scanned += 1;
      const newUrl = await fixUrl(d.document);
      if (newUrl && newUrl !== d.document) {
        d.document = newUrl;
        await d.save();
        summary.disciplinary.updated += 1;
      }
    }

    return res.json({ msg: 'Migración ejecutada', summary });
  } catch (error) {
    console.error('[AdminMigration] Error general:', error);
    return res.status(500).json({ msg: 'Error en la migración', error: error.message });
  }
};

// Enviar WhatsApp de prueba vía Twilio
exports.testTwilioWhatsApp = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }

    const { to, body } = req.body || {};
    if (!to) {
      return res.status(400).json({ msg: 'Falta el número destino (to).' });
    }
    const text = body || 'Prueba de WhatsApp desde SJ-Empleados (Twilio)';

    const result = await sendWhatsApp(to, text);
    if (result?.error) {
      return res.status(400).json({ msg: 'Error enviando WhatsApp', error: result.error });
    }
    return res.json({ msg: 'WhatsApp enviado', result });
  } catch (e) {
    console.error('[Admin] testTwilioWhatsApp error:', e);
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};

// Enviar WhatsApp de prueba a todos los empleados con teléfono
exports.broadcastTwilioWhatsApp = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo admin.' });
    }

    const { body } = req.body || {};
    const text = body || 'Prueba de WhatsApp masivo desde SJ-Empleados (Twilio)';

    // Obtener empleados con teléfono cargado
    const employees = await Employee.find({ telefono: { $exists: true, $ne: null, $ne: '' } }).select('nombre apellido telefono');
    const results = [];
    let sent = 0;
    let errors = 0;

    for (const emp of employees) {
      try {
        const result = await sendWhatsApp(emp.telefono, text);
        if (result?.sid) {
          sent += 1;
          results.push({ empleado: `${emp.nombre} ${emp.apellido}`, telefono: emp.telefono, sid: result.sid });
        } else if (result?.mock) {
          results.push({ empleado: `${emp.nombre} ${emp.apellido}`, telefono: emp.telefono, mock: true });
        } else {
          errors += 1;
          results.push({ empleado: `${emp.nombre} ${emp.apellido}`, telefono: emp.telefono, error: result?.error || 'unknown_error' });
        }
      } catch (e) {
        errors += 1;
        results.push({ empleado: `${emp.nombre} ${emp.apellido}`, telefono: emp.telefono, error: e.message });
      }
    }

    return res.json({ msg: 'Broadcast ejecutado', total: employees.length, sent, errors, results });
  } catch (e) {
    console.error('[Admin] broadcastTwilioWhatsApp error:', e);
    return res.status(500).json({ msg: 'Error interno', error: e.message });
  }
};