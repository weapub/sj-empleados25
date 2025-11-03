const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Endpoint de mantenimiento: migrar formatos en recursos raw de Cloudinary
router.post('/migrate/raw-formats', auth, adminController.migrateRawFormats);

// Endpoint de prueba Twilio WhatsApp (solo admin)
router.post('/twilio/test-whatsapp', auth, adminController.testTwilioWhatsApp);

module.exports = router;