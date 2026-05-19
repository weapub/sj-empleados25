import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Switch,
  FormControlLabel, Alert, CircularProgress, Grid,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';
import DocumentViewerModal from '../common/DocumentViewerModal';
import { getEmployees, createAttendance, getAttendances, updateAttendance } from '../../services/api';

const AttendanceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentDocUrl, setCurrentDocUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'inasistencia',
    justified: false,
    lostPresentismo: true,
    comments: '',
    justificationDocument: null,
    scheduledEntry: '',
    actualEntry: '',
    certificateExpiry: '',
    vacationsStart: '',
    vacationsEnd: '',
    suspensionDays: '',
    returnToWorkDate: '',
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setEmployees(arr);
        if (!isEdit) setLoading(false);
      } catch (_) {
        setError('Error al cargar los empleados');
        setLoading(false);
      }
    };
    loadEmployees();
  }, [isEdit]);

  useEffect(() => {
    const toYMD = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
    const loadAttendance = async () => {
      if (!isEdit) return;
      try {
        const all = await getAttendances();
        const arr = Array.isArray(all) ? all : (Array.isArray(all?.data) ? all.data : []);
        const att = arr.find((a) => a._id === id);
        if (!att) {
          setError('Registro de asistencia no encontrado');
          setLoading(false);
          return;
        }
        setFormData({
          employeeId: att.employee?._id || '',
          date: toYMD(att.date) || new Date().toISOString().split('T')[0],
          type: att.type || 'inasistencia',
          justified: !!att.justified,
          lostPresentismo: !!att.lostPresentismo,
          comments: att.comments || '',
          justificationDocument: null,
          scheduledEntry: att.scheduledEntry || '',
          actualEntry: att.actualEntry || '',
          certificateExpiry: toYMD(att.certificateExpiry),
          vacationsStart: toYMD(att.vacationsStart),
          vacationsEnd: toYMD(att.vacationsEnd),
          suspensionDays: att.suspensionDays ?? '',
          returnToWorkDate: toYMD(att.returnToWorkDate),
        });
        setCurrentDocUrl(att.justificationDocument || '');
      } catch (_) {
        setError('Error al cargar el registro de asistencia');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [id, isEdit]);

  // Limpiar campos que no aplican al cambiar el tipo
  useEffect(() => {
    setFormData(prev => {
      const next = { ...prev };
      if (prev.type !== 'tardanza') { next.scheduledEntry = ''; next.actualEntry = ''; }
      if (prev.type !== 'licencia medica') { next.certificateExpiry = ''; }
      if (prev.type !== 'vacaciones') { next.vacationsStart = ''; next.vacationsEnd = ''; }
      if (prev.type !== 'sancion recibida') { next.suspensionDays = ''; next.returnToWorkDate = ''; }
      return next;
    });
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      setSelectedFileName(files[0]?.name || '');
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name) => (e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const submitData = new FormData();
      submitData.append('employeeId', formData.employeeId);
      submitData.append('date', formData.date);
      submitData.append('type', formData.type);
      submitData.append('justified', formData.justified);
      submitData.append('lostPresentismo', formData.lostPresentismo);
      submitData.append('comments', formData.comments);
      if (formData.scheduledEntry) submitData.append('scheduledEntry', formData.scheduledEntry);
      if (formData.actualEntry) submitData.append('actualEntry', formData.actualEntry);
      if (formData.certificateExpiry) submitData.append('certificateExpiry', formData.certificateExpiry);
      if (formData.vacationsStart) submitData.append('vacationsStart', formData.vacationsStart);
      if (formData.vacationsEnd) submitData.append('vacationsEnd', formData.vacationsEnd);
      if (formData.suspensionDays) submitData.append('suspensionDays', formData.suspensionDays);
      if (formData.returnToWorkDate) submitData.append('returnToWorkDate', formData.returnToWorkDate);
      if (formData.justificationDocument) submitData.append('justificationDocument', formData.justificationDocument);

      if (isEdit) {
        await updateAttendance(id, submitData);
        setSuccess('Registro de asistencia actualizado correctamente');
      } else {
        await createAttendance(submitData);
        setSuccess('Registro de asistencia creado correctamente');
      }
      navigate('/attendance');
    } catch (err) {
      const serverMsg = err?.response?.data?.msg || err?.message;
      setError(serverMsg || (isEdit ? 'Error al actualizar el registro' : 'Error al crear el registro'));
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ClockIcon sx={{ fontSize: 22 }} />
          {isEdit ? 'Editar Inasistencia / Tardanza' : 'Registrar Inasistencia / Tardanza'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

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
                <MenuItem value="">Seleccionar Empleado</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.nombre} {emp.apellido} — Legajo: {emp.legajo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Fecha */}
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Fecha *"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Tipo */}
            <Grid xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo *"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <MenuItem value="inasistencia">Inasistencia</MenuItem>
                <MenuItem value="tardanza">Tardanza</MenuItem>
                <MenuItem value="licencia medica">Licencia Médica</MenuItem>
                <MenuItem value="vacaciones">Vacaciones</MenuItem>
                <MenuItem value="sancion recibida">Sanción Recibida</MenuItem>
              </TextField>
            </Grid>

            {/* Certificado */}
            <Grid xs={12} md={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Certificado médico (JPG, PNG, PDF — máx. 5 MB)
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {selectedFileName || 'Seleccionar archivo'}
                  <input
                    type="file"
                    name="justificationDocument"
                    accept=".jpg,.jpeg,.png,.pdf"
                    hidden
                    onChange={handleChange}
                  />
                </Button>
                {currentDocUrl && (
                  <Button
                    size="small"
                    variant="text"
                    sx={{ ml: 1 }}
                    onClick={() => setViewerOpen(true)}
                  >
                    Ver actual
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Campos condicionales: Tardanza */}
            {formData.type === 'tardanza' && (
              <>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Hora de entrada establecida *"
                    type="time"
                    name="scheduledEntry"
                    value={formData.scheduledEntry}
                    onChange={handleChange}
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Hora de entrada registrada *"
                    type="time"
                    name="actualEntry"
                    value={formData.actualEntry}
                    onChange={handleChange}
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </>
            )}

            {/* Campos condicionales: Licencia Médica */}
            {formData.type === 'licencia medica' && (
              <>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Vencimiento del certificado"
                    type="date"
                    name="certificateExpiry"
                    value={formData.certificateExpiry}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha de reincorporación"
                    type="date"
                    name="returnToWorkDate"
                    value={formData.returnToWorkDate}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </>
            )}

            {/* Campos condicionales: Vacaciones */}
            {formData.type === 'vacaciones' && (
              <>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Inicio de vacaciones"
                    type="date"
                    name="vacationsStart"
                    value={formData.vacationsStart}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fin de vacaciones"
                    type="date"
                    name="vacationsEnd"
                    value={formData.vacationsEnd}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </>
            )}

            {/* Campos condicionales: Sanción */}
            {formData.type === 'sancion recibida' && (
              <>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Días de suspensión"
                    type="number"
                    name="suspensionDays"
                    value={formData.suspensionDays}
                    onChange={handleChange}
                    slotProps={{ input: { inputProps: { min: 0 } } }}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha de reincorporación"
                    type="date"
                    name="returnToWorkDate"
                    value={formData.returnToWorkDate}
                    onChange={handleChange}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </>
            )}

            {/* Switches */}
            <Grid xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.justified}
                    onChange={handleSwitchChange('justified')}
                    color="success"
                  />
                }
                label="Justificado"
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.lostPresentismo}
                    onChange={handleSwitchChange('lostPresentismo')}
                    color="error"
                  />
                }
                label="Pierde Presentismo"
              />
            </Grid>

            {/* Comentarios */}
            <Grid xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Comentarios"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            {/* Botones */}
            <Grid xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/attendance')}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  startIcon={<SaveIcon />}
                  sx={{ borderRadius: 2.5 }}
                >
                  {isEdit ? 'Actualizar' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {currentDocUrl && (
        <DocumentViewerModal
          show={viewerOpen}
          onHide={() => setViewerOpen(false)}
          url={currentDocUrl}
          title="Certificado médico"
        />
      )}
    </Box>
  );
};

export default AttendanceForm;
