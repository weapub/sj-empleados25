const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Endpoint de mantenimiento: migrar formatos en recursos raw de Cloudinary
router.post('/migrate/raw-formats', auth, adminController.migrateRawFormats);

// Endpoint de prueba Twilio WhatsApp (solo admin)
router.post('/twilio/test-whatsapp', auth, adminController.testTwilioWhatsApp);

// Endpoint de prueba Twilio WhatsApp masivo (solo admin)
router.post('/twilio/test-whatsapp-all', auth, adminController.broadcastTwilioWhatsApp);

// Enviar informe mensual de presentismo por WhatsApp (solo admin)
router.post('/presentismo/report/send', auth, adminController.sendPresentismoMonthlyReport);

// CRUD destinatarios de Presentismo (solo admin)
router.get('/presentismo/recipients', auth, adminController.getPresentismoRecipients);
router.post('/presentismo/recipients', auth, adminController.createPresentismoRecipient);
router.put('/presentismo/recipients/:id', auth, adminController.updatePresentismoRecipient);
router.delete('/presentismo/recipients/:id', auth, adminController.deletePresentismoRecipient);

module.exports = router;