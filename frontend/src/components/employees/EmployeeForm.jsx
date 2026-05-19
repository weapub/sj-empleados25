import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Grid, Typography, TextField, Button, Switch,
  FormControlLabel, Divider, CircularProgress, Alert, MenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { createEmployee, getEmployeeById, updateEmployee } from '../../services/api';

const SectionBlock = ({ title, icon, children }) => (
  <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: 'divider', overflow: 'hidden' }}>
    <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700} fontSize="0.9375rem">{title}</Typography>
    </Box>
    <Box sx={{ p: 2.5 }}>
      <Grid container spacing={2.5}>{children}</Grid>
    </Box>
  </Paper>
);

const Field = ({ children, xs = 12, sm = 6 }) => (
  <Grid item xs={xs} sm={sm}>{children}</Grid>
);

const EMPTY_FORM = {
  nombre: '', apellido: '', dni: '', email: '', telefono: '',
  puesto: '', departamento: '', salario: '', fechaContratacion: '',
  activo: true, cuit: '', fechaIngreso: '', fechaRegistroARCA: '',
  fechaNacimiento: '', lugarNacimiento: '', domicilio: '', sucursal: '',
  fechaBaja: '', motivoBaja: '',
};

const fmtDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

const EmployeeForm = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isEditing   = !!id;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    getEmployeeById(id)
      .then(data => setFormData({
        ...data,
        fechaContratacion:  fmtDate(data.fechaContratacion),
        fechaIngreso:       fmtDate(data.fechaIngreso),
        fechaRegistroARCA:  fmtDate(data.fechaRegistroARCA),
        fechaNacimiento:    fmtDate(data.fechaNacimiento),
        fechaBaja:          fmtDate(data.fechaBaja),
        motivoBaja:         data.motivoBaja || '',
      }))
      .catch(() => setError('Error al cargar los datos del empleado'))
      .finally(() => setFetching(false));
  }, [id, isEditing]);

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...formData };
      ['fechaContratacion','fechaIngreso','fechaRegistroARCA','fechaNacimiento','fechaBaja']
        .forEach(k => { if (payload[k] === '') payload[k] = null; });
      if (payload.activo) { payload.fechaBaja = null; payload.motivoBaja = ''; }
      if (isEditing) await updateEmployee(id, payload);
      else           await createEmployee(payload);
      navigate('/employees');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
  );

  const legajoPreview = formData.dni ? `SJ-${String(formData.dni).replace(/\D/g, '')}` : '';

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? <EditIcon sx={{ fontSize: 22 }} /> : <PersonAddIcon sx={{ fontSize: 22 }} />}
            {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {isEditing ? 'Modificá los datos del empleado' : 'Completá los datos para registrar un nuevo empleado'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/employees')}>
          Cancelar
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* ── Datos personales ── */}
      <SectionBlock title="Datos Personales" icon={<PersonIcon fontSize="small" />}>
        <Field><TextField label="Nombre" name="nombre" value={formData.nombre} onChange={onChange} required fullWidth size="small" /></Field>
        <Field><TextField label="Apellido" name="apellido" value={formData.apellido} onChange={onChange} required fullWidth size="small" /></Field>
        <Field><TextField label="DNI" name="dni" value={formData.dni} onChange={onChange} fullWidth size="small" /></Field>
        <Field>
          <TextField
            label="Legajo (generado automáticamente)"
            value={legajoPreview}
            disabled
            fullWidth
            size="small"
          />
        </Field>
        <Field><TextField label="CUIT" name="cuit" value={formData.cuit} onChange={onChange} fullWidth size="small" /></Field>
        <Field><TextField label="Email" name="email" type="email" value={formData.email} onChange={onChange} required fullWidth size="small" /></Field>
        <Field><TextField label="Teléfono" name="telefono" value={formData.telefono} onChange={onChange} fullWidth size="small" /></Field>
        <Field>
          <TextField label="Fecha de Nacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={onChange} fullWidth size="small"
            slotProps={{ inputLabel: { shrink: true } }} />
        </Field>
        <Field><TextField label="Lugar de Nacimiento" name="lugarNacimiento" value={formData.lugarNacimiento} onChange={onChange} fullWidth size="small" /></Field>
        <Field xs={12} sm={12}><TextField label="Domicilio" name="domicilio" value={formData.domicilio} onChange={onChange} fullWidth size="small" /></Field>
      </SectionBlock>

      {/* ── Datos laborales ── */}
      <SectionBlock title="Datos Laborales" icon={<WorkIcon fontSize="small" />}>
        <Field><TextField label="Puesto" name="puesto" value={formData.puesto} onChange={onChange} required fullWidth size="small" /></Field>
        <Field><TextField label="Departamento" name="departamento" value={formData.departamento} onChange={onChange} required fullWidth size="small" /></Field>
        <Field><TextField label="Sucursal" name="sucursal" value={formData.sucursal} onChange={onChange} fullWidth size="small" /></Field>
        <Field>
          <TextField label="Salario" name="salario" type="number" value={formData.salario} onChange={onChange} required fullWidth size="small"
            slotProps={{ input: { inputProps: { min: 0 } } }} />
        </Field>
        <Field>
          <TextField label="Fecha de Contratación" name="fechaContratacion" type="date" value={formData.fechaContratacion} onChange={onChange} fullWidth size="small"
            slotProps={{ inputLabel: { shrink: true } }} />
        </Field>
        <Field>
          <TextField label="Fecha de Ingreso" name="fechaIngreso" type="date" value={formData.fechaIngreso} onChange={onChange} fullWidth size="small"
            slotProps={{ inputLabel: { shrink: true } }} />
        </Field>
        <Field>
          <TextField label="Fecha de Registro en ARCA" name="fechaRegistroARCA" type="date" value={formData.fechaRegistroARCA} onChange={onChange} fullWidth size="small"
            slotProps={{ inputLabel: { shrink: true } }} />
        </Field>
        <Field xs={12} sm={12}>
          <FormControlLabel
            control={<Switch name="activo" checked={!!formData.activo} onChange={onChange} color="success" />}
            label={<Typography variant="body2" fontWeight={500}>Empleado activo</Typography>}
          />
        </Field>

        {/* Campos de baja — solo cuando está inactivo */}
        {!formData.activo && (
          <>
            <Field>
              <TextField
                label="Fecha de baja"
                name="fechaBaja"
                type="date"
                value={formData.fechaBaja}
                onChange={onChange}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Field>
            <Field xs={12} sm={12}>
              <TextField
                label="Motivo de baja"
                name="motivoBaja"
                value={formData.motivoBaja}
                onChange={onChange}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Ej: Renuncia voluntaria, despido, vencimiento contrato…"
              />
            </Field>
          </>
        )}
      </SectionBlock>

      {/* ── Footer ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button variant="outlined" onClick={() => navigate('/employees')}>Cancelar</Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear empleado'}
        </Button>
      </Box>

    </Box>
  );
};

export default EmployeeForm;
