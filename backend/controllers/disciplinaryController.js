const Disciplinary = require('../models/Disciplinary');
const Employee = require('../models/Employee');
const { deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinary');

// Crear una nueva medida disciplinaria
exports.createDisciplinary = async (req, res) => {
  try {
    const { employeeId, date, time, type, description, signed, signedDate, durationDays, returnToWorkDate } = req.body;
    
    // Verificar si el empleado existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Empleado no encontrado' });
    }

    let document = null;
    
    // Manejar la carga de archivos si hay un documento
    if (req.file) {
      const isHttpUrl = req.file.path && /^https?:\/\//i.test(req.file.path);
      if (isHttpUrl) {
        document = req.file.path;
      } else if (req.file.filename) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        document = `${baseUrl}/uploads/${req.file.filename}`;
      }
    }

    // Calcular reincorporación si corresponde
    let finalReturn = returnToWorkDate || null;
    const parsedDays = durationDays && !isNaN(parseInt(durationDays, 10)) ? parseInt(durationDays, 10) : null;
    if (!finalReturn && parsedDays) {
      const base = new Date(date);
      base.setDate(base.getDate() + parsedDays);
      finalReturn = base;
    }

    const disciplinary = new Disciplinary({
      employee: employeeId,
      date,
      time: time || null,
      type,
      description,
      document,
      signed: signed === 'true',
      signedDate: signedDate || null,
      durationDays: parsedDays,
      returnToWorkDate: finalReturn || null
    });

    await disciplinary.save();

    // Registrar evento del legajo
    try {
      const EmployeeEvent = require('../models/EmployeeEvent');
      const typeLabel = String(type).toUpperCase();
      const dateStr = new Date(date).toLocaleDateString('es-AR');
      const timeStr = time ? ` a las ${time}` : '';
      const msg = `Se registró una medida disciplinaria (${typeLabel}) el ${dateStr}${timeStr}.` +
        (description ? ` Detalle: ${description}` : '') +
        (parsedDays ? ` Suspensión: ${parsedDays} día(s).` : '') +
        (finalReturn ? ` Reincorporación: ${new Date(finalReturn).toLocaleDateString('es-AR')}.` : '');
      const event = new EmployeeEvent({
        employee: employeeId,
        type: 'disciplinary_created',
        message: msg,
        changes: [
          { field: 'disciplinary', from: null, to: { type, date, signed: disciplinary.signed, durationDays: parsedDays, returnToWorkDate: finalReturn } }
        ]
      });
      await event.save();
    } catch (e) {
      console.error('No se pudo registrar el evento disciplinario:', e);
    }

    // Enviar WhatsApp automático si hay teléfono y datos
    try {
      const emp = await Employee.findById(employeeId);
      if (emp && emp.telefono) {
        const { sendWhatsApp } = require('../utils/whatsapp');
        const createdInfo = `el ${new Date(date).toLocaleDateString('es-AR')}${time ? ` a las ${time}` : ''}`;
        await sendWhatsApp(
          emp.telefono,
          `RRHH: Medida disciplinaria (${String(type).toUpperCase()}) ${createdInfo}. ${description || ''} ${parsedDays ? `Suspensión: ${parsedDays} día(s).` : ''} ${finalReturn ? `Reincorp.: ${new Date(finalReturn).toLocaleDateString('es-AR')}` : ''}`
        );
      }
    } catch (e) {
      console.error('No se pudo enviar WhatsApp disciplinario:', e.message);
    }

    res.status(201).json({ 
      msg: 'Medida disciplinaria registrada correctamente',
      disciplinary 
    });
  } catch (error) {
    // Manejo específico de errores de validación
    if (error && error.name === 'ValidationError') {
      try {
        const errors = Object.keys(error.errors || {}).map((field) => ({
          field,
          message: error.errors[field]?.message || 'Valor inválido'
        }));
        return res.status(400).json({ msg: 'Datos inválidos', errors });
      } catch (e) {
        // Fallback si no se puede serializar errores
        return res.status(400).json({ msg: 'Datos inválidos' });
      }
    }
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener medidas disciplinarias con soporte de paginación y filtros básicos
exports.getAllDisciplinaries = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 0, 0), 200); // 0 = sin límite para compatibilidad

    const hasQueryParams = (
      req.query.page || req.query.limit || req.query.employeeId || req.query.type ||
      typeof req.query.signed !== 'undefined' || req.query.sortBy || req.query.sortDir
    );

    const filter = {};
    if (req.query.employeeId) {
      filter.employee = req.query.employeeId;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (typeof req.query.signed !== 'undefined' && req.query.signed !== '') {
      filter.signed = String(req.query.signed) === 'true';
    }

    const sortBy = (req.query.sortBy || 'date');
    const sortDir = (req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const sort = sortBy === 'date' ? { date: sortDir } : { date: -1 };

    if (!hasQueryParams) {
      const disciplinaries = await Disciplinary.find(filter)
        .populate({ path: 'employee', select: 'nombre apellido legajo', options: { lean: true } })
        .sort({ date: -1 })
        .lean();
      return res.json(disciplinaries);
    }

    const [data, total] = await Promise.all([
      Disciplinary.find(filter)
        .populate({ path: 'employee', select: 'nombre apellido legajo', options: { lean: true } })
        .sort(sort)
        .skip(limit > 0 ? (page - 1) * limit : 0)
        .limit(limit > 0 ? limit : 0)
        .lean(),
      Disciplinary.countDocuments(filter),
    ]);

    const totalPages = limit > 0 ? Math.max(Math.ceil(total / limit), 1) : 1;
    res.status(200).json({ data, total, page, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener medidas disciplinarias por empleado
exports.getDisciplinariesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const disciplinaries = await Disciplinary.find({ employee: employeeId })
      .sort({ date: -1 })
      .lean();
    
    res.json(disciplinaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener una medida disciplinaria por ID
exports.getDisciplinaryById = async (req, res) => {
  try {
    const { id } = req.params;
    const disciplinary = await Disciplinary.findById(id)
      .populate({ path: 'employee', select: 'nombre apellido legajo', options: { lean: true } })
      .lean();
    if (!disciplinary) {
      return res.status(404).json({ msg: 'Medida disciplinaria no encontrada' });
    }
    res.json(disciplinary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Actualizar una medida disciplinaria
exports.updateDisciplinary = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, time, signed, signedDate, durationDays, returnToWorkDate } = req.body;
    
    const disciplinary = await Disciplinary.findById(id);
    if (!disciplinary) {
      return res.status(404).json({ msg: 'Medida disciplinaria no encontrada' });
    }
    
    // Actualizar campos
    disciplinary.type = type;
    disciplinary.description = description;
    if (time !== undefined) disciplinary.time = time || null;
    const prevSigned = disciplinary.signed;
    disciplinary.signed = signed === 'true';
    disciplinary.signedDate = signedDate || disciplinary.signedDate;
    const prevDuration = disciplinary.durationDays;
    const prevReturn = disciplinary.returnToWorkDate;
    const parsedDays = durationDays && !isNaN(parseInt(durationDays, 10)) ? parseInt(durationDays, 10) : durationDays === '' ? null : disciplinary.durationDays;
    if (durationDays !== undefined) disciplinary.durationDays = parsedDays;
    if (returnToWorkDate !== undefined) disciplinary.returnToWorkDate = returnToWorkDate || null;
    // Si hay días y no hay fecha explícita, recalcular reincorporación
    if (!disciplinary.returnToWorkDate && disciplinary.durationDays) {
      const base = new Date(disciplinary.date);
      base.setDate(base.getDate() + parseInt(disciplinary.durationDays, 10));
      disciplinary.returnToWorkDate = base;
    }
    disciplinary.updatedAt = Date.now();
    
    // Si hay un nuevo archivo, actualizar el documento
    if (req.file) {
      // Si ya existía un documento previo, eliminarlo de Cloudinary
      if (disciplinary.document) {
        try {
          const publicId = extractPublicIdFromUrl(disciplinary.document);
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        } catch (error) {
          console.error('Error eliminando archivo anterior de Cloudinary:', error);
        }
      }
      
      const isHttpUrl = req.file.path && /^https?:\/\//i.test(req.file.path);
      if (isHttpUrl) {
        disciplinary.document = req.file.path;
      } else if (req.file.filename) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        disciplinary.document = `${baseUrl}/uploads/${req.file.filename}`;
      }
    }
    
    await disciplinary.save();

    // Registrar evento si la firma o fechas cambiaron
    try {
      if (prevSigned !== disciplinary.signed) {
        const EmployeeEvent = require('../models/EmployeeEvent');
        const msg = disciplinary.signed
          ? 'La medida disciplinaria fue firmada.'
          : 'La medida disciplinaria dejó de figurar como firmada.';
        const event = new EmployeeEvent({
          employee: disciplinary.employee,
          type: 'disciplinary_signature_update',
          message: msg,
          changes: [
            { field: 'disciplinary.signed', from: prevSigned, to: disciplinary.signed }
          ]
        });
        await event.save();
      }
      if (prevDuration !== disciplinary.durationDays || String(prevReturn) !== String(disciplinary.returnToWorkDate)) {
        const EmployeeEvent = require('../models/EmployeeEvent');
        const msg = `Actualización: Suspensión ${disciplinary.durationDays ?? '-'} día(s), Reincorporación ${disciplinary.returnToWorkDate ? new Date(disciplinary.returnToWorkDate).toLocaleDateString('es-AR') : '-'}.`;
        const event = new EmployeeEvent({
          employee: disciplinary.employee,
          type: 'disciplinary_dates_update',
          message: msg,
          changes: [
            { field: 'disciplinary.durationDays', from: prevDuration, to: disciplinary.durationDays },
            { field: 'disciplinary.returnToWorkDate', from: prevReturn, to: disciplinary.returnToWorkDate }
          ]
        });
        await event.save();
      }
    } catch (e) {
      console.error('No se pudo registrar evento de firma disciplinaria:', e);
    }

    res.json({ 
      msg: 'Medida disciplinaria actualizada correctamente',
      disciplinary 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Eliminar una medida disciplinaria
exports.deleteDisciplinary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const disciplinary = await Disciplinary.findById(id);
    if (!disciplinary) {
      return res.status(404).json({ msg: 'Medida disciplinaria no encontrada' });
    }
    
    // Si hay un documento, eliminarlo de Cloudinary
    if (disciplinary.document) {
      try {
        const publicId = extractPublicIdFromUrl(disciplinary.document);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        console.error('Error eliminando archivo de Cloudinary:', error);
      }
    }
    
    await Disciplinary.findByIdAndDelete(id);
    
    res.json({ msg: 'Medida disciplinaria eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};