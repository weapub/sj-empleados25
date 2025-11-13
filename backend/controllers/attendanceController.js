const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const EmployeeEvent = require('../models/EmployeeEvent');
const { sendWhatsApp } = require('../utils/whatsapp');
const { deleteFromCloudinary, extractPublicIdFromUrl } = require('../utils/cloudinary');

// Crear una nueva inasistencia o tardanza
exports.createAttendance = async (req, res) => {
  try {
    const { employeeId, date, type, justified, lostPresentismo, comments, scheduledEntry, actualEntry, certificateExpiry, vacationsStart, vacationsEnd, suspensionDays, returnToWorkDate } = req.body;
    
    // Verificar si el empleado existe
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Empleado no encontrado' });
    }

    let justificationDocument = null;
    
    // Manejar la carga de archivos si hay un certificado médico
    if (req.file) {
      // Si es Cloudinary, vendrá una URL completa en path; si es local, construir URL pública
      const isHttpUrl = req.file.path && /^https?:\/\//i.test(req.file.path);
      if (isHttpUrl) {
        justificationDocument = req.file.path;
      } else if (req.file.filename) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        justificationDocument = `${baseUrl}/uploads/${req.file.filename}`;
      }
    }

    // Calcular minutos de tardanza si corresponde
    let lateMinutes = 0;
    if (type === 'tardanza' && scheduledEntry && actualEntry) {
      const [sh, sm] = String(scheduledEntry).split(':').map(n => parseInt(n, 10));
      const [ah, am] = String(actualEntry).split(':').map(n => parseInt(n, 10));
      const schedMins = sh * 60 + sm;
      const actualMins = ah * 60 + am;
      lateMinutes = Math.max(0, actualMins - schedMins);
    }

    // Calcular fechas automáticas
    let finalReturnToWork = returnToWorkDate || null;
    let vacStart = vacationsStart || null;
    let vacEnd = vacationsEnd || null;
    let certExpiry = certificateExpiry || null;

    if (type === 'vacaciones') {
      // Si no se indica explícitamente, usar 'date' como inicio
      vacStart = vacStart || date;
      // Mantener vacEnd como lo que se envíe; el controlador no deduce duración
    }
    if (type === 'sancion recibida') {
      // Si hay días de suspensión, calcular fecha de reincorporación
      if (!finalReturnToWork && suspensionDays && !isNaN(parseInt(suspensionDays, 10))) {
        const base = new Date(date);
        base.setDate(base.getDate() + parseInt(suspensionDays, 10));
        finalReturnToWork = base;
      }
    }

    const attendance = new Attendance({
      employee: employeeId,
      date,
      type,
      justified,
      justificationDocument,
      lostPresentismo,
      comments,
      scheduledEntry: scheduledEntry || null,
      actualEntry: actualEntry || null,
      lateMinutes,
      certificateExpiry: certExpiry || null,
      vacationsStart: vacStart || null,
      vacationsEnd: vacEnd || null,
      suspensionDays: suspensionDays || null,
      returnToWorkDate: finalReturnToWork || null
    });

    await attendance.save();

    // Registrar evento según tipo de asistencia
    try {
      let evType = 'attendance_created';
      let evMsg = `Nueva asistencia registrada (${type}) para ${employee.nombre} ${employee.apellido} el ${new Date(date).toLocaleDateString('es-AR')}.`;
      if (type === 'licencia medica') {
        if (justificationDocument) {
          evType = 'medical_certificate_uploaded';
          evMsg = `Certificado médico cargado para ${employee.nombre} ${employee.apellido} (${new Date(date).toLocaleDateString('es-AR')}).` + (certExpiry ? ` Vence el ${new Date(certExpiry).toLocaleDateString('es-AR')}.` : '');
        } else {
          evType = 'medical_leave_registered';
          evMsg = `Licencia médica registrada para ${employee.nombre} ${employee.apellido} (${new Date(date).toLocaleDateString('es-AR')}).` + (certExpiry ? ` Certificado vence el ${new Date(certExpiry).toLocaleDateString('es-AR')}.` : ' Recordatorio: presentar certificado si corresponde.');
        }
      } else if (type === 'vacaciones') {
        evType = 'vacations_registered';
        const startStr = vacStart ? new Date(vacStart).toLocaleDateString('es-AR') : new Date(date).toLocaleDateString('es-AR');
        const endStr = vacEnd ? new Date(vacEnd).toLocaleDateString('es-AR') : '-';
        evMsg = `Vacaciones registradas para ${employee.nombre} ${employee.apellido} desde ${startStr} hasta ${endStr}.` + (finalReturnToWork ? ` Reincorporación el ${new Date(finalReturnToWork).toLocaleDateString('es-AR')}.` : '');
      } else if (type === 'sancion recibida') {
        evType = 'disciplinary_received';
        evMsg = `Sanción registrada en el legajo de ${employee.nombre} ${employee.apellido} (${new Date(date).toLocaleDateString('es-AR')}).` + (suspensionDays ? ` Duración: ${suspensionDays} día(s).` : '') + (finalReturnToWork ? ` Reincorporación el ${new Date(finalReturnToWork).toLocaleDateString('es-AR')}.` : '');
      } else if (type === 'tardanza') {
        evType = 'late_arrival';
        evMsg = `Tardanza registrada para ${employee.nombre} ${employee.apellido}: ${lateMinutes} minutos tarde (Establecida ${scheduledEntry || '-'}, Registrada ${actualEntry || '-'}).`;
      }

      const event = new EmployeeEvent({
        employee: employeeId,
        type: evType,
        message: evMsg,
        changes: [
          { field: 'attendance', from: null, to: { date, type, justified, lostPresentismo } }
        ]
      });
      await event.save();

      // Enviar WhatsApp automático en asistencias críticas si hay teléfono
      if (employee.telefono) {
        try {
          await sendWhatsApp(employee.telefono, evMsg);
        } catch (werr) {
          console.error('No se pudo enviar WhatsApp:', werr.message);
        }
      }
    } catch (e) {
      console.error('No se pudo registrar evento de asistencia:', e);
    }

    res.status(201).json({
      msg: 'Registro de asistencia creado correctamente',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener inasistencias/tardanzas con soporte de paginación y filtros básicos
exports.getAllAttendances = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 0, 0), 200); // 0 = sin límite para compatibilidad

    const hasQueryParams = (
      req.query.page || req.query.limit || req.query.employeeId || req.query.type ||
      typeof req.query.justified !== 'undefined' || req.query.sortBy || req.query.sortDir
    );

    const filter = {};
    if (req.query.employeeId) {
      filter.employee = req.query.employeeId;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (typeof req.query.justified !== 'undefined' && req.query.justified !== '') {
      filter.justified = String(req.query.justified) === 'true';
    }

    // Soporte de orden por fecha; otros órdenes se mantienen en cliente
    const sortBy = (req.query.sortBy || 'date');
    const sortDir = (req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const sort = sortBy === 'date' ? { date: sortDir } : { date: -1 };

    if (!hasQueryParams) {
      // Compatibilidad: devolver array simple cuando no hay query params
      const attendances = await Attendance.find(filter)
        .populate({ path: 'employee', select: 'nombre apellido legajo', options: { lean: true } })
        .sort({ date: -1 })
        .lean();
      return res.json(attendances);
    }

    const [data, total] = await Promise.all([
      Attendance.find(filter)
        .populate({ path: 'employee', select: 'nombre apellido legajo', options: { lean: true } })
        .sort(sort)
        .skip(limit > 0 ? (page - 1) * limit : 0)
        .limit(limit > 0 ? limit : 0)
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    const totalPages = limit > 0 ? Math.max(Math.ceil(total / limit), 1) : 1;
    res.status(200).json({ data, total, page, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener inasistencias/tardanzas por empleado
exports.getAttendancesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const attendances = await Attendance.find({ employee: employeeId })
      .sort({ date: -1 })
      .lean();
    
    res.json(attendances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Actualizar un registro de asistencia
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { justified, lostPresentismo, comments, scheduledEntry, actualEntry, certificateExpiry, vacationsStart, vacationsEnd, suspensionDays, returnToWorkDate } = req.body;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ msg: 'Registro de asistencia no encontrado' });
    }
    
    // Guardar valores previos
    const prev = {
      justified: attendance.justified,
      lostPresentismo: attendance.lostPresentismo,
      comments: attendance.comments,
      justificationDocument: attendance.justificationDocument,
      scheduledEntry: attendance.scheduledEntry,
      actualEntry: attendance.actualEntry,
      lateMinutes: attendance.lateMinutes,
      certificateExpiry: attendance.certificateExpiry,
      vacationsStart: attendance.vacationsStart,
      vacationsEnd: attendance.vacationsEnd,
      suspensionDays: attendance.suspensionDays,
      returnToWorkDate: attendance.returnToWorkDate
    };

    // Actualizar campos
    attendance.justified = justified;
    attendance.lostPresentismo = lostPresentismo;
    attendance.comments = comments;
    // Actualizar horarios si se enviaron
    if (scheduledEntry !== undefined) attendance.scheduledEntry = scheduledEntry || null;
    if (actualEntry !== undefined) attendance.actualEntry = actualEntry || null;

    // Actualizar campos de fechas adicionales
    if (certificateExpiry !== undefined) attendance.certificateExpiry = certificateExpiry || null;
    if (vacationsStart !== undefined) attendance.vacationsStart = vacationsStart || null;
    if (vacationsEnd !== undefined) attendance.vacationsEnd = vacationsEnd || null;
    if (suspensionDays !== undefined) attendance.suspensionDays = suspensionDays || null;
    if (returnToWorkDate !== undefined) attendance.returnToWorkDate = returnToWorkDate || attendance.returnToWorkDate || null;

    // Recalcular fecha de reincorporación si es sanción y hay días
    if (attendance.type === 'sancion recibida' && attendance.suspensionDays && !attendance.returnToWorkDate) {
      const base = new Date(attendance.date);
      base.setDate(base.getDate() + parseInt(attendance.suspensionDays, 10));
      attendance.returnToWorkDate = base;
    }

    // Recalcular tardanza
    if (attendance.type === 'tardanza' && attendance.scheduledEntry && attendance.actualEntry) {
      const [sh, sm] = String(attendance.scheduledEntry).split(':').map(n => parseInt(n, 10));
      const [ah, am] = String(attendance.actualEntry).split(':').map(n => parseInt(n, 10));
      const schedMins = sh * 60 + sm;
      const actualMins = ah * 60 + am;
      attendance.lateMinutes = Math.max(0, actualMins - schedMins);
    } else {
      attendance.lateMinutes = 0;
    }

    attendance.updatedAt = Date.now();
    
    // Si hay un nuevo archivo, actualizar el documento de justificación
    if (req.file) {
      // Si ya existía un documento previo, eliminarlo de Cloudinary
      if (attendance.justificationDocument) {
        try {
          const publicId = extractPublicIdFromUrl(attendance.justificationDocument);
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        } catch (error) {
          console.error('Error eliminando archivo anterior de Cloudinary:', error);
        }
      }
      
      // Si es Cloudinary, vendrá una URL completa en path; si es local, construir URL pública
      const isHttpUrl = req.file.path && /^https?:\/\//i.test(req.file.path);
      if (isHttpUrl) {
        attendance.justificationDocument = req.file.path;
      } else if (req.file.filename) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        attendance.justificationDocument = `${baseUrl}/uploads/${req.file.filename}`;
      }
    }
    
    // Cambio en horarios/tardanza
    if (prev.scheduledEntry !== attendance.scheduledEntry || prev.actualEntry !== attendance.actualEntry || prev.lateMinutes !== attendance.lateMinutes) {
      const ev = new EmployeeEvent({
        employee: attendance.employee,
        type: 'late_arrival_update',
        message: `Actualización de horarios. Establecida ${attendance.scheduledEntry || '-'}, Registrada ${attendance.actualEntry || '-'}, Tardanza ${attendance.lateMinutes} min.`,
        changes: [
          { field: 'attendance.scheduledEntry', from: prev.scheduledEntry, to: attendance.scheduledEntry },
          { field: 'attendance.actualEntry', from: prev.actualEntry, to: attendance.actualEntry },
          { field: 'attendance.lateMinutes', from: prev.lateMinutes, to: attendance.lateMinutes }
        ]
      });
      await ev.save();
    }
    
    await attendance.save();

    // Registrar eventos por cambios relevantes
    try {
      // Cambio en justificación
      if (prev.justified !== attendance.justified) {
        const ev = new EmployeeEvent({
          employee: attendance.employee,
          type: 'attendance_justification_update',
          message: attendance.justified ? 'La ausencia quedó justificada.' : 'La ausencia quedó sin justificar.',
          changes: [{ field: 'attendance.justified', from: prev.justified, to: attendance.justified }]
        });
        await ev.save();
      }
      // Carga/actualización de certificado médico
      if (prev.justificationDocument !== attendance.justificationDocument && attendance.type === 'licencia medica') {
        const ev = new EmployeeEvent({
          employee: attendance.employee,
          type: 'medical_certificate_uploaded',
          message: 'Se cargó/actualizó el certificado médico en el legajo.',
          changes: [{ field: 'attendance.justificationDocument', from: prev.justificationDocument, to: attendance.justificationDocument }]
        });
        await ev.save();
      }
      // Actualizaciones de fechas relevantes
      if (prev.certificateExpiry !== attendance.certificateExpiry && attendance.type === 'licencia medica') {
        const ev = new EmployeeEvent({
          employee: attendance.employee,
          type: 'medical_certificate_expiry_update',
          message: attendance.certificateExpiry ? `Se actualizó fecha de vencimiento de certificado: ${new Date(attendance.certificateExpiry).toLocaleDateString('es-AR')}` : 'Se eliminó la fecha de vencimiento del certificado.',
          changes: [{ field: 'attendance.certificateExpiry', from: prev.certificateExpiry, to: attendance.certificateExpiry }]
        });
        await ev.save();
      }
      if ((prev.vacationsStart !== attendance.vacationsStart || prev.vacationsEnd !== attendance.vacationsEnd) && attendance.type === 'vacaciones') {
        const ev = new EmployeeEvent({
          employee: attendance.employee,
          type: 'vacations_dates_update',
          message: `Se actualizaron fechas de vacaciones: Inicio ${attendance.vacationsStart ? new Date(attendance.vacationsStart).toLocaleDateString('es-AR') : '-'} Fin ${attendance.vacationsEnd ? new Date(attendance.vacationsEnd).toLocaleDateString('es-AR') : '-'}.`,
          changes: [
            { field: 'attendance.vacationsStart', from: prev.vacationsStart, to: attendance.vacationsStart },
            { field: 'attendance.vacationsEnd', from: prev.vacationsEnd, to: attendance.vacationsEnd }
          ]
        });
        await ev.save();
      }
      if ((prev.suspensionDays !== attendance.suspensionDays || prev.returnToWorkDate !== attendance.returnToWorkDate) && attendance.type === 'sancion recibida') {
        const ev = new EmployeeEvent({
          employee: attendance.employee,
          type: 'disciplinary_return_update',
          message: `Se actualizó suspensión: Días ${attendance.suspensionDays || '-'}, Reincorporación ${attendance.returnToWorkDate ? new Date(attendance.returnToWorkDate).toLocaleDateString('es-AR') : '-'}.`,
          changes: [
            { field: 'attendance.suspensionDays', from: prev.suspensionDays, to: attendance.suspensionDays },
            { field: 'attendance.returnToWorkDate', from: prev.returnToWorkDate, to: attendance.returnToWorkDate }
          ]
        });
        await ev.save();
      }
    } catch (e) {
      console.error('No se pudo registrar evento de actualización de asistencia:', e);
    }

    res.json({
      msg: 'Registro de asistencia actualizado correctamente',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Eliminar un registro de asistencia
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ msg: 'Registro de asistencia no encontrado' });
    }
    
    // Si hay un documento de justificación, eliminarlo de Cloudinary
    if (attendance.justificationDocument) {
      try {
        const publicId = extractPublicIdFromUrl(attendance.justificationDocument);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        console.error('Error eliminando archivo de Cloudinary:', error);
      }
    }
    
    await Attendance.findByIdAndDelete(id);
    
    res.json({ msg: 'Registro de asistencia eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Obtener estadísticas de asistencia para el dashboard
exports.getAttendanceStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Total de inasistencias del mes
    const absencesThisMonth = await Attendance.countDocuments({
      type: 'inasistencia',
      date: { $gte: firstDayOfMonth }
    });
    
    // Total de tardanzas del mes
    const lateArrivalsThisMonth = await Attendance.countDocuments({
      type: 'tardanza',
      date: { $gte: firstDayOfMonth }
    });
    
    // Total de empleados sin presentismo este mes
    const employeesWithoutPresentismo = await Attendance.distinct('employee', {
      lostPresentismo: true,
      date: { $gte: firstDayOfMonth }
    });
    
    res.json({
      absencesThisMonth,
      lateArrivalsThisMonth,
      employeesWithoutPresentismoCount: employeesWithoutPresentismo.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};