const PayrollReceipt = require('../models/PayrollReceipt');
const Employee = require('../models/Employee');
const { applyPayrollDeduction } = require('./accountController');

// Create receipt
exports.createReceipt = async (req, res) => {
  try {
    const {
      employeeId,
      period,
      paymentDate,
      signed,
      signedDate,
      hasPresentismo,
      extraHours,
      otherAdditions,
      discounts,
      advanceRequested,
      advanceDate,
      advanceAmount,
      netAmount
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Empleado no encontrado' });
    }

    const signedBool = signed === 'true' || signed === true;
    const presentismoBool = hasPresentismo === 'true' || hasPresentismo === true;
    const advanceBool = advanceRequested === 'true' || advanceRequested === true;
    const extraHoursNum = Number(extraHours) || 0;
    const otherAdditionsNum = Number(otherAdditions) || 0;
    const discountsNum = Number(discounts) || 0;
    const advanceAmountNum = Number(advanceAmount) || 0;
    // Net mensual base ingresado (no descontar adelanto a nivel mensual)
    const baseNet = Number(netAmount) || 0;
    let finalNet = baseNet;

    // Aplicar deducción semanal de cuenta corriente si corresponde
    const { applied: accountDeductionApplied, netAfter } = await applyPayrollDeduction(employeeId, period, finalNet);
    finalNet = netAfter;

    const receipt = new PayrollReceipt({
      employee: employeeId,
      period,
      paymentDate,
      signed: signedBool,
      signedDate: signedBool ? (signedDate || null) : null,
      hasPresentismo: presentismoBool,
      extraHours: extraHoursNum,
      otherAdditions: otherAdditionsNum,
      discounts: discountsNum,
      advanceRequested: advanceBool,
      advanceDate: advanceBool ? (advanceDate || null) : null,
      advanceAmount: advanceAmountNum,
      accountDeductionApplied,
      netAmount: finalNet
    });

    await receipt.save();

    // Registrar evento de recibo disponible / estado de firma
    try {
      const EmployeeEvent = require('../models/EmployeeEvent');
      const baseMsg = `Nuevo recibo disponible. Periodo ${period}, pago ${new Date(paymentDate).toLocaleDateString('es-AR')}, neto ${finalNet.toLocaleString('es-AR')}.`;
      const signMsg = signedBool ? ' Estado: firmado.' : ' Estado: pendiente de firma.';
      const event = new EmployeeEvent({
        employee: employeeId,
        type: 'payroll_created',
        message: baseMsg + signMsg,
        changes: [
          { field: 'payroll', from: null, to: { period, paymentDate, netAmount: finalNet, signed: signedBool } }
        ]
      });
      await event.save();
    } catch (e) {
      console.error('No se pudo registrar evento de recibo:', e);
    }

    res.status(201).json({ msg: 'Recibo creado correctamente', receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// List all receipts
exports.getAllReceipts = async (req, res) => {
  try {
    const receipts = await PayrollReceipt.find()
      .populate('employee', 'nombre apellido legajo')
      .sort({ paymentDate: -1 })
      .lean();
    res.json(receipts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Get by employee
exports.getReceiptsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const receipts = await PayrollReceipt.find({ employee: employeeId })
      .sort({ paymentDate: -1 });
    res.json(receipts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Get by id
exports.getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await PayrollReceipt.findById(id).populate('employee', 'nombre apellido legajo');
    if (!receipt) {
      return res.status(404).json({ msg: 'Recibo no encontrado' });
    }
    res.json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Update receipt
exports.updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await PayrollReceipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ msg: 'Recibo no encontrado' });
    }

    const {
      period,
      paymentDate,
      signed,
      signedDate,
      hasPresentismo,
      extraHours,
      otherAdditions,
      discounts,
      advanceRequested,
      advanceDate,
      advanceAmount,
      netAmount
    } = req.body;

    receipt.period = period ?? receipt.period;
    receipt.paymentDate = paymentDate ?? receipt.paymentDate;
    const prevSigned = receipt.signed;
    if (signed !== undefined) receipt.signed = signed === 'true' || signed === true;
    receipt.signedDate = receipt.signed ? (signedDate ?? receipt.signedDate) : null;
    if (hasPresentismo !== undefined) receipt.hasPresentismo = hasPresentismo === 'true' || hasPresentismo === true;
    if (extraHours !== undefined) receipt.extraHours = Number(extraHours) || 0;
    if (otherAdditions !== undefined) receipt.otherAdditions = Number(otherAdditions) || 0;
    if (discounts !== undefined) receipt.discounts = Number(discounts) || 0;
    if (advanceRequested !== undefined) receipt.advanceRequested = advanceRequested === 'true' || advanceRequested === true;
    receipt.advanceDate = receipt.advanceRequested ? (advanceDate ?? receipt.advanceDate) : null;
    if (advanceAmount !== undefined) receipt.advanceAmount = Number(advanceAmount) || 0;
    // Mantener neto mensual sin descontar adelanto; se descuenta en cálculo semanal
    const baseNetForUpdate = netAmount !== undefined ? (Number(netAmount) || 0) : receipt.netAmount;
    receipt.netAmount = baseNetForUpdate;
    receipt.updatedAt = Date.now();

    await receipt.save();

    // Registrar evento si la firma cambió
    try {
      if (prevSigned !== receipt.signed) {
        const EmployeeEvent = require('../models/EmployeeEvent');
        const msg = receipt.signed ? 'El recibo fue firmado.' : 'El recibo quedó pendiente de firma.';
        const event = new EmployeeEvent({
          employee: receipt.employee,
          type: 'payroll_signature_update',
          message: msg,
          changes: [
            { field: 'payroll.signed', from: prevSigned, to: receipt.signed }
          ]
        });
        await event.save();
      }
    } catch (e) {
      console.error('No se pudo registrar evento de firma de recibo:', e);
    }

    res.json({ msg: 'Recibo actualizado correctamente', receipt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Delete
exports.deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await PayrollReceipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ msg: 'Recibo no encontrado' });
    }
    await PayrollReceipt.findByIdAndDelete(id);
    res.json({ msg: 'Recibo eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

// Weekly breakdown with advance deduction
exports.getWeeklyBreakdown = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period, weeks } = req.query;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ msg: 'Empleado no encontrado' });
    }

    let receipt;
    if (period) {
      receipt = await PayrollReceipt.findOne({ employee: employeeId, period });
    } else {
      receipt = await PayrollReceipt.findOne({ employee: employeeId }).sort({ paymentDate: -1 });
    }

    if (!receipt) {
      return res.status(404).json({ msg: 'Recibo no encontrado para el periodo especificado' });
    }

    const weeksCount = Math.max(1, Math.min(6, Number(weeks) || 4));
    const advanceTotal = receipt.advanceRequested ? (Number(receipt.advanceAmount) || 0) : 0;
    const monthlyNet = Number(receipt.netAmount) || 0; // NETO A COBRAR

    // Calcular días del mes desde period (YYYY-MM)
    const daysInMonth = (() => {
      try {
        const [y, m] = String(receipt.period || period).split('-').map(n => parseInt(n, 10));
        return new Date(y, m, 0).getDate();
      } catch (_) {
        return 30;
      }
    })();

    // Fórmula semanal: NETO A COBRAR / días del mes × 7
    const weeklyBase = Math.round(((monthlyNet / daysInMonth) * 7) * 100) / 100;
    const weeksArray = new Array(weeksCount).fill(weeklyBase);

    // Descontar adelanto SOLO en la primera semana (no arrastra a siguientes)
    const appliedAdvance = Math.min(weeksArray[0], advanceTotal);
    weeksArray[0] = Math.round((weeksArray[0] - appliedAdvance) * 100) / 100;

    const totalAfterAdvance = Math.round(weeksArray.reduce((a, b) => a + b, 0) * 100) / 100;

    res.json({
      employee: { id: employee._id, nombre: employee.nombre, apellido: employee.apellido, legajo: employee.legajo },
      period: receipt.period,
      paymentDate: receipt.paymentDate,
      weeks: weeksArray,
      weeksCount,
      advanceApplied: appliedAdvance,
      accountDeductionApplied: receipt.accountDeductionApplied || 0,
      monthlyNet,
      totalAfterAdvance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};