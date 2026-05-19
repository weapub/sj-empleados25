import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Switch,
  FormControlLabel, CircularProgress, Grid,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';
import { getEmployees, createDisciplinary, updateDisciplinary, getDisciplinaryById } from '../../services/api';
import DocumentViewerModal from '../common/DocumentViewerModal';
import Swal from 'sweetalert2';

const DisciplinaryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: 'verbal',
    description: '',
    document: null,
    signed: false,
    signedDate: '',
    durationDays: '',
    returnToWorkDate: '',
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setEmployees(arr);
      } catch (_) {}
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const loadDisciplinary = async () => {
      try {
        setLoading(true);
        const d = await getDisciplinaryById(id);
        setFormData({
          employeeId: d.employee?._id || '',
          date: new Date(d.date).toISOString().split('T')[0],
          time: d.time || '',
          type: d.type,
          description: d.description || '',
          document: null,
          signed: Boolean(d.signed),
          signedDate: d.signedDate ? new Date(d.signedDate).toISOString().split('T')[0] : '',
          durationDays: d.durationDays ?? '',
          returnToWorkDate: d.returnToWorkDate ? new Date(d.returnToWorkDate).toISOString().split('T')[0] : '',
        });
        setCurrentDocUrl(d.document || '');
      } catch (_) {
        Swal.fire('Error', 'No se pudo cargar la medida disciplinaria', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadDisciplinary();
  }, [isEdit, id]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      setSelectedFileName(files[0]?.name || '');
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name) => (e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.date || !formData.type) {
      Swal.fire('Error', 'Por favor complete los campos obligatorios', 'error');
      return;
    }
    if (!String(formData.description || '').trim()) {
      Swal.fire('Error', 'La descripción es obligatoria', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = new FormData();
      data.append('employeeId', formData.employeeId);
      data.append('date', formData.date);
      if (formData.time) data.append('time', formData.time);
      data.append('type', formData.type);
      data.append('description', formData.description);
      data.append('signed', formData.signed);
      if (formData.signedDate) data.append('signedDate', formData.signedDate);
      if (formData.durationDays) data.append('durationDays', formData.durationDays);
      if (formData.returnToWorkDate) data.append('returnToWorkDate', formData.returnToWorkDate);
      if (formData.document) data.append('document', formData.document);

      if (isEdit) {
        await updateDisciplinary(id, data);
        Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
      } else {
        await createDisciplinary(data);
        Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
      }
      navigate('/disciplinary');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.msg || 'No se pudo guardar la medida disciplinaria';
      Swal.fire('Error', msg, 'error');
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
          <GavelIcon sx={{ fontSize: 22 }} />
          {isEdit ? 'Editar Medida Disciplinaria' : 'Registrar Nueva Medida Disciplinaria'}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: 'divider' }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={2.5}>

            {/* Empleado */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Empleado *"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                disabled={isEdit}
              >
                <MenuItem value="">Seleccione un empleado</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.nombre} {emp.apellido} — Legajo: {emp.legajo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Fecha */}
            <Grid item xs={12} md={6}>
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

            {/* Hora */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Hora"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Tipo */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo de Medida *"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <MenuItem value="verbal">Verbal</MenuItem>
                <MenuItem value="formal">Formal</MenuItem>
                <MenuItem value="grave">Grave</MenuItem>
              </TextField>
            </Grid>

            {/* Días suspensión */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Días de suspensión"
                type="number"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleChange}
                slotProps={{ input: { inputProps: { min: 0 } } }}
              />
            </Grid>

            {/* Fecha reincorporación */}
            <Grid item xs={12} md={6}>
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

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Descripción *"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                required
                placeholder="Detalles de la medida disciplinaria"
              />
            </Grid>

            {/* Documento */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Documento (PDF, JPG, PNG — máx. 5 MB)
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
                    name="document"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                    onChange={handleChange}
                  />
                </Button>
                {isEdit && currentDocUrl && (
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

            {/* Firmado */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.signed}
                    onChange={handleSwitchChange('signed')}
                    color="info"
                  />
                }
                label="Firmado por el empleado"
              />
            </Grid>

            {/* Fecha firma */}
            <Grid item xs={12} md={6}>
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

            {/* Botones */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/disciplinary')}
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

      {isEdit && currentDocUrl && (
        <DocumentViewerModal
          show={viewerOpen}
          onHide={() => setViewerOpen(false)}
          url={currentDocUrl}
          title="Documento actual de la medida"
        />
      )}
    </Box>
  );
};

export default DisciplinaryForm;
