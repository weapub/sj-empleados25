const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Disciplinary = require('../models/Disciplinary');
const { cloudinary, extractPublicIdFromUrl } = require('../utils/cloudinary');
const https = require('https');
const http = require('http');
const { sendWhatsApp } = require('../utils/whatsapp');

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