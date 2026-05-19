import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Switch,
  FormControlLabel, CircularProgress, Grid,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { getEmployees, createPayrollReceipt, updatePayrollReceipt, getPayrollReceiptById } from '../../services/api';

const daysInMonth = (period) => {
  try {
    const [y, m] = period.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
  } catch (_) {
    return 30;
  }
};

const PayrollForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    period: new Date().toISOString().slice(0, 7),
    paymentDate: new Date().toISOString().split('T')[0],
    signed: false,
    signedDate: '',
    hasPresentismo: false,
    extraHours: 0,
    otherAdditions: 0,
    discounts: 0,
    advanceRequested: false,
    advanceDate: '',
    advanceAmount: 0,
    netAmount: 0,
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const resp = await getEmployees();
        const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
        setEmployees(list);
      } catch (_) {}
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!isEdit) return;
      try {
        setLoading(true);
        const r = await getPayrollReceiptById(id);
        setFormData({
          employeeId: r.employee?._id || '',
          period: r.period,
          paymentDate: new Date(r.paymentDate).toISOString().split('T')[0],
          signed: Boolean(r.signed),
          signedDate: r.signedDate ? new Date(r.signedDate).toISOString().split('T')[0] : '',
          hasPresentismo: Boolean(r.hasPresentismo),
          extraHours: Number(r.extraHours) || 0,
          otherAdditions: Number(r.otherAdditions) || 0,
          discounts: Number(r.discounts) || 0,
          advanceRequested: Boolean(r.advanceRequested),
          advanceDate: r.advanceDate ? new Date(r.advanceDate).toISOString().split('T')[0] : '',
          advanceAmount: Number(r.advanceAmount) || 0,
          netAmount: Number(r.netAmount) || 0,
        });
      } catch (_) {
        Swal.fire('Error', 'No se pudo cargar el recibo', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadReceipt();
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['extraHours', 'otherAdditions', 'discounts', 'advanceAmount', 'netAmount'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  const handleSwitchChange = (name) => (e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.checked }));
  };

  const weeklyAmount = () => {
    const dim = daysInMonth(formData.period);
    const baseNet = Number(formData.netAmount) || 0;
    const advance = formData.advanceRequested ? (Number(formData.advanceAmount) || 0) : 0;
    return Math.round(((baseNet / dim) * 7) - advance);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.period || !formData.paymentDate) {
      Swal.fire('Error', 'Complete los campos obligatorios', 'error');
      return;
    }
    try {
      setLoading(true);
      const payload = { ...formData };
      if (!formData.signed) payload.signedDate = '';
      if (!formData.advanceRequested) payload.advanceDate = '';
      if (isEdit) {
        await updatePayrollReceipt(id, payload);
        Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
      } else {
        await createPayrollReceipt(payload);
        Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
      }
      navigate('/payroll');
    } catch (_) {
      Swal.fire('Error', 'No se pudo guardar el recibo', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit && !formData.employeeId) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ fontSize: 22 }} />
          {isEdit ? 'Editar Recibo de Sueldo' : 'Nuevo Recibo de Sueldo'}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: 'divider' }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={2.5}>

            {/* Empleado */}
            <Grid xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Empleado *"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
              >
                <MenuItem value="">Seleccione...</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.nombre} {emp.apellido} ({emp.legajo})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Período */}
            <Grid xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Período (MM-YYYY) *"
                type="month"
                name="period"
                value={formData.period}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Fecha de pago */}
            <Grid xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Fecha de Pago *"
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Firmado switch */}
            <Grid xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.signed}
                    onChange={handleSwitchChange('signed')}
                    color="info"
                  />
                }
                label="Firmado"
              />
            </Grid>

            {/* Fecha firma */}
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Fecha de Firma"
                type="date"
                name="signedDate"
                value={formData.signedDate}
                onChange={handleChange}
                disabled={!formData.signed}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Presentismo switch */}
            <Grid xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasPresentismo}
                    onChange={handleSwitchChange('hasPresentismo')}
                    color="success"
                  />
                }
                label="Presentismo"
              />
            </Grid>

            {/* Montos */}
            <Grid xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Horas Extras (Monto)"
                type="number"
                name="extraHours"
                value={formData.extraHours}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Otros Adicionales"
                type="number"
                name="otherAdditions"
                value={formData.otherAdditions}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Descuentos"
                type="number"
                name="discounts"
                value={formData.discounts}
                onChange={handleChange}
              />
            </Grid>
            <Grid xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="NETO A COBRAR (Mensual) *"
                type="number"
                name="netAmount"
                value={formData.netAmount}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Adelanto switch */}
            <Grid xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.advanceRequested}
                    onChange={handleSwitchChange('advanceRequested')}
                    color="warning"
                  />
                }
                label="Adelanto solicitado"
              />
            </Grid>

            {/* Fecha adelanto */}
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Fecha de Adelanto"
                type="date"
                name="advanceDate"
                value={formData.advanceDate}
                onChange={handleChange}
                disabled={!formData.advanceRequested}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Monto adelanto */}
            <Grid xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Monto del Adelanto"
                type="number"
                name="advanceAmount"
                value={formData.advanceAmount}
                onChange={handleChange}
                disabled={!formData.advanceRequested}
              />
            </Grid>

            {/* Monto semanal calculado (readonly) */}
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Monto semanal calculado"
                value={`$${weeklyAmount().toLocaleString('es-AR')}`}
                slotProps={{ input: { readOnly: true } }}
                helperText="Fórmula: (NETO / días del mes × 7) − Adelanto"
              />
            </Grid>

            {/* Botones */}
            <Grid xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/payroll')}
                >
                  Volver
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                  sx={{ borderRadius: 2.5 }}
                >
                  {isEdit ? 'Actualizar' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default PayrollForm;
