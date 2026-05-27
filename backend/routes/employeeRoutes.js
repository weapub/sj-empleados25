const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');

// Rutas para empleados
router.get('/', auth, employeeController.getEmployees);
router.get('/:id', auth, employeeController.getEmployeeById);
router.post('/', auth, employeeController.createEmployee);
router.put('/:id', auth, employeeController.updateEmployee);
router.delete('/:id', auth, employeeController.deleteEmployee);
router.patch('/:id/restore', auth, employeeController.restoreEmployee);

module.exports = router;