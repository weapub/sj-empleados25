import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Grid, Typography, Avatar, Button, Chip, IconButton, Tooltip,
  Divider, TextField, MenuItem, List, ListItem, ListItemText, CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  WhatsApp as WhatsAppIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  EventNote as EventIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById, deleteEmployee, getEmployeeEvents, createEmployeeEvent } from '../../services/api';
import Swal from 'sweetalert2';

const avatarColor = (name = '') => {
  const colors = ['#8C57FF','#16B1FF','#56CA00','#FFB400','#FF4C51','#A379FF'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
    <Box
      sx={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'primary.main',
        opacity: 0.85,
      }}
    >
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fff', textTransform: 'uppercase', lineHeight: 1.6 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ pl: 0.25 }}>
      {value || '—'}
    </Typography>
  </Box>
);

const SectionPaper = ({ title, icon, children }) => (
  <Paper variant="outlined" sx={{ borderRadius: 4, borderColor: 'divider', overflow: 'hidden' }}>
    <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700} fontSize="0.9375rem">{title}</Typography>
    </Box>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Paper>
);

const EVENT_TYPES = [
  { value: 'general',           label: 'General' },
  { value: 'recibo',            label: 'Recibo' },
  { value: 'disciplinario',     label: 'Disciplinario' },
  { value: 'certificado_medico',label: 'Certificado Médico' },
  { value: 'vacaciones',        label: 'Vacaciones' },
  { value: 'presentacion',      label: 'Presentación' },
  { value: 'suspension',        label: 'Suspensión' },
];

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [events, setEvents]             = useState([]);
  const [newEventType, setNewEventType] = useState('general');
  const [newEventMsg, setNewEventMsg]   = useState('');
  const [savingEvent, setSavingEvent]   = useState(false);

  useEffect(() => {
    getEmployeeById(id)
      .then(setEmployee)
      .catch(() => setError('Error al cargar los datos del empleado'))
      .finally(() => setLoading(false));
    getEmployeeEvents(id).then(setEvents).catch(() => {});
  }, [id]);

  const normalizeWaNumber = (raw) => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return null;
    const withCountry = digits.startsWith('54') ? digits : `54${digits}`;
    const cleaned = `54${withCountry.slice(2).replace(/^0+/, '')}`;
    return cleaned.length < 10 ? null : cleaned;
  };

  const openWhatsApp = (text) => {
    if (!employee?.telefono) { Swal.fire({ icon: 'warning', title: 'Sin teléfono', text: 'No hay teléfono cargado.' }); return; }
    const num = normalizeWaNumber(employee.telefono);
    if (!num) { Swal.fire({ icon: 'warning', title: 'Número inválido', text: 'Verificá que incluya código de área.' }); return; }
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text || '')}`, '_blank', 'noopener');
  };

  const templateMessage = (kind) => {
    const nombre = employee ? `${employee.nombre} ${employee.apellido}` : 'Empleado';
    const hoy = new Date().toLocaleDateString('es-AR');
    switch (kind) {
      case 'recibo_disponible':      return `Hola ${nombre}, tu recibo de sueldo ya está disponible. Fecha ${hoy}.`;
      case 'recibo_firmado':         return `Hola ${nombre}, confirmamos que tu recibo está firmado.`;
      case 'apercibimiento':         return `Hola ${nombre}, se emitió un apercibimiento en tu legajo. Por favor revisá el detalle.`;
      case 'suspension': {
        const dias   = prompt('¿Cuántos días dura la suspensión?');
        const retorno = prompt('¿Fecha de reincorporación (DD/MM/AAAA)?');
        return `Hola ${nombre}, se te ha aplicado una suspensión de ${dias} días. Debés presentarte el ${retorno}.`;
      }
      case 'certificado_medico_vencido': {
        const fecha = prompt('¿Fecha de vencimiento?');
        return `Hola ${nombre}, venció el plazo para presentar tu certificado médico el ${fecha}.`;
      }
      case 'presentarse_trabajar': {
        const fecha = prompt('¿Fecha y hora de presentación?');
        return `Hola ${nombre}, debés presentarte a trabajar el ${fecha}.`;
      }
      case 'vacaciones': {
        const dias  = prompt('¿Cuántos días de vacaciones?');
        const inicio = prompt('¿Fecha de inicio?');
        const fin    = prompt('¿Fecha de fin?');
        return `Hola ${nombre}, tus vacaciones son de ${dias} días, desde ${inicio} hasta ${fin}.`;
      }
      default: return '';
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventMsg.trim()) return;
    setSavingEvent(true);
    try {
      await createEmployeeEvent({ employeeId: id, type: newEventType, message: newEventMsg });
      const evs = await getEmployeeEvents(id);
      setEvents(evs);
      setNewEventMsg('');
    } catch { Swal.fire({ icon: 'error', title: 'Error al registrar evento' }); }
    finally { setSavingEvent(false); }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '¿Eliminar empleado?',
      text: `Esto eliminará a ${employee?.nombre} ${employee?.apellido} permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4C51',
      cancelButtonColor: '#8A8D93',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteEmployee(id);
      navigate('/employees');
    } catch { Swal.fire({ icon: 'error', title: 'Error al eliminar' }); }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!employee) return <Alert severity="warning">No se encontró el empleado</Alert>;

  const color    = avatarColor(`${employee.nombre}${employee.apellido}`);
  const initials = `${employee.nombre?.charAt(0) || ''}${employee.apellido?.charAt(0) || ''}`.toUpperCase();
  const legajo   = employee.legajo || (employee.dni ? `SJ-${String(employee.dni).replace(/\D/g, '')}` : '—');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: color, fontSize: 20, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" lineHeight={1.2}>
              {employee.nombre} {employee.apellido}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
              {employee.puesto && <Chip label={employee.puesto} size="small" sx={{ borderRadius: 1.5, fontSize: '0.72rem', bgcolor: 'action.selected' }} />}
              <Chip
                label={employee.activo !== false ? 'Activo' : 'Inactivo'}
                size="small"
                sx={{
                  borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 600,
                  bgcolor: employee.activo !== false ? 'rgba(86,202,0,0.12)' : 'rgba(255,76,81,0.12)',
                  color:   employee.activo !== false ? '#4DB600' : '#FF4C51',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<BackIcon />} size="small" onClick={() => navigate('/employees')}>
            Volver
          </Button>
          <Button variant="outlined" color="warning" startIcon={<EditIcon />} size="small" onClick={() => navigate(`/employees/edit/${id}`)}>
            Editar
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} size="small" onClick={handleDelete}>
            Eliminar
          </Button>
          {employee.telefono && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<WhatsAppIcon />}
              sx={{ color: '#16A34A', borderColor: '#16A34A', '&:hover': { bgcolor: 'rgba(22,163,74,0.06)', borderColor: '#15803D' } }}
              onClick={() => events.length > 0
                ? openWhatsApp(`Aviso: ${events[0]?.message}`)
                : Swal.fire({ icon: 'info', title: 'Sin eventos', text: 'Registrá un evento primero.' })
              }
            >
              WhatsApp
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Banner de baja ── */}
      {employee.activo === false && (
        <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'error.main', bgcolor: 'rgba(255,76,81,0.06)', p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <DeleteIcon sx={{ color: 'error.main', mt: 0.25 }} />
          <Box>
            <Typography variant="subtitle2" color="error.main" fontWeight={700}>Empleado dado de baja</Typography>
            {employee.fechaBaja && (
              <Typography variant="body2" color="text.secondary">
                Fecha de baja: <strong>{new Date(employee.fechaBaja).toLocaleDateString('es-AR')}</strong>
              </Typography>
            )}
            {employee.motivoBaja && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Motivo: <strong>{employee.motivoBaja}</strong>
              </Typography>
            )}
            {!employee.motivoBaja && !employee.fechaBaja && (
              <Typography variant="body2" color="text.secondary">Sin motivo registrado.</Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* ── Datos ── */}
      <Grid container spacing={2.5}>
        {/* Personal */}
        <Grid xs={12} md={6}>
          <SectionPaper title="Información Personal" icon={<PersonIcon fontSize="small" />}>
            <Grid container spacing={2.5}>
              <Grid xs={6}><InfoRow label="Legajo"   value={legajo} /></Grid>
              <Grid xs={6}><InfoRow label="DNI"      value={employee.dni} /></Grid>
              <Grid xs={6}><InfoRow label="CUIT"     value={employee.cuit} /></Grid>
              <Grid xs={6}><InfoRow label="Teléfono" value={employee.telefono} /></Grid>
              <Grid xs={12}><InfoRow label="Email"   value={employee.email} /></Grid>
              <Grid xs={6}><InfoRow label="Fecha de Nacimiento" value={fmt(employee.fechaNacimiento)} /></Grid>
              <Grid xs={6}><InfoRow label="Lugar de Nacimiento" value={employee.lugarNacimiento} /></Grid>
              <Grid xs={12}><InfoRow label="Domicilio" value={employee.domicilio} /></Grid>
            </Grid>
          </SectionPaper>
        </Grid>

        {/* Laboral */}
        <Grid xs={12} md={6}>
          <SectionPaper title="Información Laboral" icon={<WorkIcon fontSize="small" />}>
            <Grid container spacing={2.5}>
              <Grid xs={6}><InfoRow label="Puesto"       value={employee.puesto} /></Grid>
              <Grid xs={6}><InfoRow label="Departamento" value={employee.departamento} /></Grid>
              <Grid xs={6}><InfoRow label="Sucursal"     value={employee.sucursal} /></Grid>
              <Grid xs={6}>
                <InfoRow label="Salario" value={employee.salario ? `$${Number(employee.salario).toLocaleString('es-AR')}` : '—'} />
              </Grid>
              <Grid xs={6}><InfoRow label="Fecha de Contratación"  value={fmt(employee.fechaContratacion)} /></Grid>
              <Grid xs={6}><InfoRow label="Fecha de Ingreso"        value={fmt(employee.fechaIngreso)} /></Grid>
              <Grid xs={6}><InfoRow label="Registro ARCA" value={fmt(employee.fechaRegistroARCA)} /></Grid>
              {employee.activo === false && (
                <>
                  <Grid xs={6}><InfoRow label="Fecha de Baja" value={fmt(employee.fechaBaja)} /></Grid>
                  <Grid xs={6}><InfoRow label="Motivo de Baja" value={employee.motivoBaja} /></Grid>
                </>
              )}
            </Grid>
          </SectionPaper>
        </Grid>
      </Grid>

      {/* ── Eventos del legajo ── */}
      <SectionPaper title="Eventos del Legajo" icon={<EventIcon fontSize="small" />}>
        {/* Nuevo evento */}
        <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2.5 }}>
          <Grid xs={12} sm>
            <TextField
              label="Mensaje del evento"
              multiline
              rows={2}
              fullWidth
              size="small"
              value={newEventMsg}
              onChange={e => setNewEventMsg(e.target.value)}
              placeholder="Escribí un mensaje para registrar y/o enviar por WhatsApp…"
            />
          </Grid>
          <Grid xs={12} sm="auto">
            <TextField
              label="Tipo"
              select
              size="small"
              value={newEventType}
              onChange={e => setNewEventType(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              {EVENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid xs={12} sm="auto">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleCreateEvent} disabled={savingEvent || !newEventMsg.trim()}>
                Registrar
              </Button>
              <Tooltip title={employee.telefono ? 'Enviar por WhatsApp' : 'Sin teléfono'}>
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<WhatsAppIcon />}
                    disabled={!employee.telefono || !newEventMsg.trim()}
                    onClick={() => openWhatsApp(newEventMsg)}
                    sx={{ color: '#16A34A', borderColor: '#16A34A', '&:hover': { bgcolor: 'rgba(22,163,74,0.06)', borderColor: '#15803D' } }}
                  >
                    Enviar
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Plantillas rápidas */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Plantillas rápidas
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {[
              ['recibo_disponible',       'Recibo disponible'],
              ['recibo_firmado',          'Recibo firmado'],
              ['apercibimiento',          'Apercibimiento'],
              ['suspension',              'Suspensión'],
              ['certificado_medico_vencido','Cert. médico vencido'],
              ['presentarse_trabajar',    'Presentarse a trabajar'],
              ['vacaciones',              'Vacaciones'],
            ].map(([key, label]) => (
              <Chip
                key={key}
                label={label}
                size="small"
                variant="outlined"
                clickable
                onClick={() => setNewEventMsg(templateMessage(key))}
                sx={{ borderRadius: 1.5, fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista de eventos */}
        {events.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <EventIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">No hay eventos registrados</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {events.map((ev, i) => (
              <React.Fragment key={ev._id}>
                {i > 0 && <Divider />}
                <ListItem
                  sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}
                  secondaryAction={
                    <Tooltip title={employee.telefono ? 'Enviar por WhatsApp' : 'Sin teléfono'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!employee.telefono}
                          onClick={() => openWhatsApp(`Aviso de San Jorge Fiambres y Quesos: ${ev.message}`)}
                          sx={{ color: '#16A34A' }}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={ev.message}
                    secondary={new Date(ev.createdAt).toLocaleString('es-AR')}
                    slotProps={{ primary: { variant: 'body2', fontWeight: 500 }, secondary: { variant: 'caption' } }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </SectionPaper>
    </Box>
  );
};

export default EmployeeDetail;
