const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Disciplinary = require('../models/Disciplinary');
const PayrollReceipt = require('../models/PayrollReceipt');

// Cache en memoria para métricas del dashboard (TTL 30s) y de-duplicación de solicitudes concurrentes
const DASHBOARD_CACHE = {
  data: null,
  ts: 0,
  promise: null,
};
const TTL_MS = 30_000;

// Obtener todas las métricas para el dashboard
exports.getDashboardMetrics = async (req, res) => {
  try {
    const now = Date.now();
    if (DASHBOARD_CACHE.data && (now - DASHBOARD_CACHE.ts) < TTL_MS) {
      return res.json(DASHBOARD_CACHE.data);
    }
    if (DASHBOARD_CACHE.promise) {
      const cached = await DASHBOARD_CACHE.promise.catch(() => null);
      if (cached) return res.json(cached);
    }

    DASHBOARD_CACHE.promise = (async () => {
      const today = new Date();
      const firstDayOfMonth  = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endPrevMonth     = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      const yyyy = today.getFullYear();
      const mm   = String(today.getMonth() + 1).padStart(2, '0');
      const currentPeriod = `${yyyy}-${mm}`;
      const prevY = endPrevMonth.getFullYear();
      const prevM = String(endPrevMonth.getMonth() + 1).padStart(2, '0');
      const prevPeriod = `${prevY}-${prevM}`;

      // Todas las consultas en paralelo — de ~14 roundtrips secuenciales a 1 batch
      const [
        empleadosActivos,
        inasistenciasMes, inasistenciasPrev,
        tardanzasMes,     tardanzasPrev,
        justificadas, injustificadas, licenciasMedicas, vacaciones, sanciones,
        sinPresentismoDistinct, sinPresentismoPrevDistinct,
        totalHistorico,
        apercibimientos,  apercibimientosPrev,
        sancionesActivas, sancionesActivasPrev,
        recibosPendientes, recibosPendientesPrev,
      ] = await Promise.all([
        Employee.countDocuments({ activo: true }),
        Attendance.countDocuments({ type: 'inasistencia', date: { $gte: firstDayOfMonth } }),
        Attendance.countDocuments({ type: 'inasistencia', date: { $gte: firstDayPrevMonth, $lte: endPrevMonth } }),
        Attendance.countDocuments({ type: 'tardanza',     date: { $gte: firstDayOfMonth } }),
        Attendance.countDocuments({ type: 'tardanza',     date: { $gte: firstDayPrevMonth, $lte: endPrevMonth } }),
        Attendance.countDocuments({ type: 'justificada',     date: { $gte: firstDayOfMonth } }),
        Attendance.countDocuments({ type: 'injustificada',   date: { $gte: firstDayOfMonth } }),
        Attendance.countDocuments({ type: 'licencia medica', date: { $gte: firstDayOfMonth } }),
        Attendance.countDocuments({ type: 'vacaciones',      date: { $gte: firstDayOfMonth } }),
        Attendance.countDocuments({ type: 'sancion recibida',date: { $gte: firstDayOfMonth } }),
        Attendance.distinct('employee', { lostPresentismo: true, date: { $gte: firstDayOfMonth } }),
        Attendance.distinct('employee', { lostPresentismo: true, date: { $gte: firstDayPrevMonth, $lte: endPrevMonth } }),
        Disciplinary.countDocuments(),
        Disciplinary.countDocuments({ type: { $in: ['verbal', 'formal'] }, date: { $gte: firstDayOfMonth } }),
        Disciplinary.countDocuments({ type: { $in: ['verbal', 'formal'] }, date: { $gte: firstDayPrevMonth, $lte: endPrevMonth } }),
        Disciplinary.countDocuments({ durationDays: { $ne: null }, returnToWorkDate: { $ne: null, $gte: today } }),
        Disciplinary.countDocuments({ durationDays: { $ne: null }, returnToWorkDate: { $ne: null, $gte: endPrevMonth } }),
        PayrollReceipt.countDocuments({ signed: false, period: currentPeriod }),
        PayrollReceipt.countDocuments({ signed: false, period: prevPeriod }),
      ]);

      const sinPresentismo     = sinPresentismoDistinct.length;
      const sinPresentismoPrev = sinPresentismoPrevDistinct.length;

    // Calcular deltas (variación porcentual mes a mes donde aplica)
    const deltaPercent = (curr, prev) => {
      if (prev > 0) {
        const diff = curr - prev;
        const pct = Math.round((diff / prev) * 100);
        const sign = pct >= 0 ? '+' : '';
        return `${sign}${pct}%`;
      }
      return null;
    };

      const metrics = {
        empleadosActivos,
        inasistenciasMes,
        tardanzasMes,
        justificadas,
        injustificadas,
        licenciasMedicas,
        vacaciones,
        sanciones,
        sinPresentismo,
        totalHistorico,
        apercibimientos,
        sancionesActivas,
        recibosPendientes,
        deltas: {
          inasistenciasMes: deltaPercent(inasistenciasMes, inasistenciasPrev),
          tardanzasMes: deltaPercent(tardanzasMes, tardanzasPrev),
          sinPresentismo: deltaPercent(sinPresentismo, sinPresentismoPrev),
          apercibimientos: deltaPercent(apercibimientos, apercibimientosPrev),
          sancionesActivas: deltaPercent(sancionesActivas, sancionesActivasPrev),
          recibosPendientes: deltaPercent(recibosPendientes, recibosPendientesPrev)
        }
      };
      DASHBOARD_CACHE.data = metrics;
      DASHBOARD_CACHE.ts = Date.now();
      return metrics;
    })();

    const result = await DASHBOARD_CACHE.promise;
    DASHBOARD_CACHE.promise = null; // liberar
    return res.json(result);
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    res.status(500).json({ msg: 'Error del servidor al obtener métricas' });
  }
};