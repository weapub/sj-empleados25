const Employee = require('../models/Employee');
const EmployeeEvent = require('../models/EmployeeEvent');

// Obtener empleados con paginación
exports.getEmployees = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 25, 1), 100);

    const [data, total] = await Promise.all([
      Employee.find()
        .sort({ apellido: 1, nombre: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.status(200).json({ data, total, page, totalPages });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener empleados', error: error.message });
  }
};

// Obtener un empleado por ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el empleado', error: error.message });
  }
};

// Crear un nuevo empleado
exports.createEmployee = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.dni) {
      payload.dni = String(payload.dni).replace(/\D/g, '');
    }
    const newEmployee = new Employee(payload);
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    if (error && error.code === 11000) {
      const fields = Object.keys(error.keyPattern || (error.keyValue || {}));
      const fieldList = fields.length ? fields.join(', ') : 'campo único';
      return res.status(400).json({ message: `Ya existe un registro con el mismo valor para: ${fieldList}` });
    }
    res.status(400).json({ message: 'Error al crear empleado', error: error.message });
  }
};

// Actualizar un empleado
exports.updateEmployee = async (req, res) => {
  try {
    const id = req.params.id;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const fieldsToCheck = [
      'puesto','departamento','salario','activo','sucursal','email','telefono','domicilio'
    ];
    const changes = [];
    for (const field of fieldsToCheck) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const fromVal = employee[field];
        const toVal = req.body[field];
        const changed = String(fromVal) !== String(toVal);
        if (changed) {
          changes.push({ field, from: fromVal, to: toVal });
        }
      }
    }

    // Apply update, sanitizando DNI
    const update = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(update, 'dni')) {
      update.dni = update.dni ? String(update.dni).replace(/\D/g, '') : '';
    }
    Object.assign(employee, update);
    const updatedEmployee = await employee.save();

    // Log event if important changes
    if (changes.length > 0) {
      const msgParts = changes.map(c => `${c.field}: '${c.from ?? '-'}' → '${c.to ?? '-'}'`);
      const message = `Modificaciones importantes en legajo de ${updatedEmployee.nombre} ${updatedEmployee.apellido}: ${msgParts.join(', ')}`;
      const event = new EmployeeEvent({
        employee: updatedEmployee._id,
        type: 'employee_update',
        message,
        changes
      });
      await event.save();
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    if (error && error.code === 11000) {
      const fields = Object.keys(error.keyPattern || (error.keyValue || {}));
      const fieldList = fields.length ? fields.join(', ') : 'campo único';
      return res.status(400).json({ message: `Ya existe un registro con el mismo valor para: ${fieldList}` });
    }
    res.status(400).json({ message: 'Error al actualizar empleado', error: error.message });
  }
};

// Eliminar un empleado
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    res.status(200).json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar empleado', error: error.message });
  }
};