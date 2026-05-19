import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Button, Paper, Divider, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  List, ListItem, ListItemText, Chip, CircularProgress, Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  GridView as LayoutIcon,
  PeopleAlt as UsersIcon,
  PersonOff as PersonOffIcon,
  EventBusy as CalendarXIcon,
  HourglassTop as ClockIcon,
  WarningAmber as WarningIcon,
  ErrorOutlined as AlertCircleIcon,
  ReceiptLong as ReceiptIcon,
  TrendingUp as TrendingIcon,
  WhatsApp as WhatsAppIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  AccessTime as AttendanceIcon,
  Gavel as DisciplinaryIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, previewPresentismoWhatsAppReport } from '../../services/api';
import MetricCardAlt from '../common/MetricCardAlt';
import { isCanceledError } from '../../utils/http';
import Swal from 'sweetalert2';

const Dashboard = () => {
  const [stats, setStats] = useState({
    empleadosActivos: 0, inasistenciasMes: 0, tardanzasMes: 0, sinPresentismo: 0,
    apercibimientos: 0, totalHistorico: 0, sancionesActivas: 0, recibosPendientes: 0,
    loading: true, error: false,
  });
  const [deltas, setDeltas] = useState({
    empleadosActivos: null, inasistenciasMes: null, tardanzasMes: null, sinPresentismo: null,
    apercibimientos: null, sancionesActivas: null, recibosPendientes: null, totalHistorico: null,
  });
  const [sendingReport, setSendingReport]     = useState(false);
  const [showPreview, setShowPreview]         = useState(false);
  const [previewData, setPreviewData]         = useState(null);
  const [modalMonth, setModalMonth]           = useState('');
  const [refreshingPreview, setRefreshingPreview] = useState(false);
  const [selectedRecipientPhone, setSelectedRecipientPhone] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setStats(p => ({ ...p, loading: false })); return; }
    const controller = new AbortController();
    const fetchStats = async () => {
      try {
        const metrics = await getDashboardMetrics({ signal: controller.signal });
        setStats(p => ({ ...p, ...metrics, loading: false, error: false }));
        if (metrics?.deltas) setDeltas(p => ({ ...p, ...metrics.deltas }));
      } catch (err) {
        if (isCanceledError(err)) return;
        setStats(p => ({ ...p, loading: false, error: true }));
      }
    };
    fetchStats();
    return () => controller.abort();
  }, []);

  const handleSendPresentismoReport = async () => {
    try {
      setSendingReport(true);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const preview = await previewPresentismoWhatsAppReport(currentMonth);
      setPreviewData(preview);
      setModalMonth(currentMonth);
      const firstPhone = Array.isArray(preview?.recipients) && preview.recipients.length > 0
        ? (preview.recipients[0]?.phone || '')
        : (Array.isArray(preview?.destinations) && preview.destinations.length > 0 ? preview.destinations[0] : '');
      setSelectedRecipientPhone(firstPhone);
      setShowPreview(true);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error al preparar informe', text: e?.response?.data?.msg || e.message });
    } finally {
      setSendingReport(false);
    }
  };

  const refreshPreview = async () => {
    try {
      setRefreshingPreview(true);
      const preview = await previewPresentismoWhatsAppReport(modalMonth || undefined);
      setPreviewData(preview);
      if (!selectedRecipientPhone) {
        const firstPhone = Array.isArray(preview?.recipients) && preview.recipients.length > 0
          ? (preview.recipients[0]?.phone || '')
          : (Array.isArray(preview?.destinations) && preview.destinations.length > 0 ? preview.destinations[0] : '');
        setSelectedRecipientPhone(firstPhone);
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo actualizar la previsualización', text: e?.response?.data?.msg || e.message });
    } finally {
      setRefreshingPreview(false);
    }
  };

  const confirmSendReport = async () => {
    try {
      setSendingReport(true);
      const message = previewData?.message || '';
      const destinationRaw = selectedRecipientPhone
        || (Array.isArray(previewData?.destinations) && previewData.destinations.length > 0 ? previewData.destinations[0] : '');
      const phoneDigits = String(destinationRaw).replace(/\D/g, '');
      if (!phoneDigits) {
        Swal.fire({ icon: 'warning', title: 'Sin destinatario', text: 'No hay número de WhatsApp configurado.' });
        return;
      }
      window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`, '_blank');
      setShowPreview(false);
      Swal.fire({ icon: 'success', title: 'WhatsApp abierto', text: `Enviando a ${destinationRaw}.` });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e?.message || 'Error desconocido' });
    } finally {
      setSendingReport(false);
    }
  };

  const mkCard = (title, value, icon, color, delta, to = null) => (
    <MetricCardAlt
      key={title}
      title={title} value={value} icon={icon} color={color}
      loading={stats.loading} error={stats.error} delta={delta} to={to}
    />
  );

  const quickActions = [
    { label: 'Nuevo Empleado',       to: '/employees/new',    icon: <PersonAddIcon />,   bg: '#8C57FF', hover: '#7E4EE6' },
    { label: 'Registrar Asistencia', to: '/attendance',       icon: <AttendanceIcon />,  bg: '#16B1FF', hover: '#0E9FE5' },
    { label: 'Nueva Disciplinaria',  to: '/disciplinary/new', icon: <DisciplinaryIcon />,bg: '#FF4C51', hover: '#d63b3f' },
    { label: 'Nuevo Recibo',         to: '/payroll/new',      icon: <ReceiptIcon />,     bg: '#56CA00', hover: '#3d9200' },
  ];

  return (
    <Box sx={{ py: { xs: 2, md: 3 } }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LayoutIcon sx={{ fontSize: 22 }} />
          Dashboard de Gestión
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Panel de control y métricas del sistema
        </Typography>
      </Box>

      {/* ── Métricas de Personal (diseño hero) ── */}
      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 3.5, overflow: 'hidden', borderColor: 'divider', boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05)' }}>
        {/* Encabezado de sección */}
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'primary.main', display: 'flex' }}><UsersIcon /></Box>
            <Typography variant="h6" fontWeight={600} fontSize="0.9375rem">Métricas de Personal</Typography>
          </Box>
          {!stats.loading && !stats.error && (
            <Chip
              label={`${stats.empleadosActivos} activos`}
              size="small"
              sx={{ bgcolor: alpha('#56CA00', 0.12), color: '#4DB600', fontWeight: 700, fontSize: '0.75rem', border: `1px solid ${alpha('#56CA00', 0.3)}` }}
            />
          )}
        </Box>

        <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Hero: Empleados Activos */}
          <Paper elevation={0} sx={{
            p: { xs: 2.5, sm: 3 }, borderRadius: 3,
            border: `1.5px solid ${alpha('#56CA00', 0.3)}`,
            bgcolor: alpha('#56CA00', 0.06),
            position: 'relative', overflow: 'hidden',
          }}>
            <UsersIcon sx={{
              position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 160, opacity: 0.06, color: '#56CA00', pointerEvents: 'none',
            }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', display: 'block', mb: 0.75 }}>
                  Empleados Activos
                </Typography>
                {stats.loading
                  ? <Skeleton variant="text" width={110} height={80} />
                  : <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: '-0.04em', color: '#4DB600', lineHeight: 1, mb: 0.5 }}>
                      {stats.error ? '—' : stats.empleadosActivos}
                    </Typography>
                }
                <Typography variant="body2" color="text.secondary">Plantilla total en actividad</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0, ml: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: alpha('#56CA00', 0.16), color: '#4DB600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UsersIcon sx={{ fontSize: 30 }} />
                </Box>
                {deltas.empleadosActivos && !stats.loading && !stats.error && (() => {
                  const dn = String(deltas.empleadosActivos).trim().startsWith('-');
                  return (
                    <Chip
                      label={`${dn ? '▼' : '▲'} ${deltas.empleadosActivos}`}
                      size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700,
                        bgcolor: dn ? alpha('#FF4C51', 0.12) : alpha('#56CA00', 0.12),
                        color: dn ? '#FF4C51' : '#4DB600',
                        border: `1px solid ${alpha(dn ? '#FF4C51' : '#56CA00', 0.3)}`,
                      }}
                    />
                  );
                })()}
              </Box>
            </Box>
          </Paper>

          {/* Tarjetas de alerta: Inasistencias, Tardanzas, Sin Presentismo */}
          <Grid container spacing={2}>
            {[
              { key: 'inas',  title: 'Inasistencias',   subtitle: 'este mes',    value: stats.inasistenciasMes, icon: <CalendarXIcon />, color: '#FF4C51', delta: deltas.inasistenciasMes },
              { key: 'tard',  title: 'Tardanzas',        subtitle: 'este mes',    value: stats.tardanzasMes,     icon: <ClockIcon />,     color: '#FFB400', delta: deltas.tardanzasMes     },
              { key: 'pres',  title: 'Sin Presentismo',  subtitle: 'empleados',   value: stats.sinPresentismo,   icon: <PersonOffIcon />, color: '#8A8D93', delta: deltas.sinPresentismo   },
            ].map(({ key, title, subtitle, value, icon, color, delta }) => {
              const dStr = String(delta || '').trim();
              const dn   = dStr.startsWith('-');
              return (
                <Grid xs={12} sm={4} key={key}>
                  <Paper elevation={0} sx={{
                    p: { xs: 2, sm: 2.5 }, borderRadius: 3, height: '100%',
                    border: `1px solid ${alpha(color, 0.22)}`,
                    borderLeft: `4px solid ${color}`,
                    bgcolor: alpha(color, 0.05),
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Watermark */}
                    <Box sx={{ position: 'absolute', right: -8, bottom: -8, color, opacity: 0.06, lineHeight: 0, pointerEvents: 'none' }}>
                      {React.cloneElement(icon, { sx: { fontSize: 72 } })}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5, position: 'relative' }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(color, 0.16), color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icon}
                      </Box>
                      {dStr && !stats.loading && !stats.error && (
                        <Chip
                          label={`${dn ? '▼' : '▲'} ${dStr}`}
                          size="small"
                          sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700,
                            bgcolor: dn ? alpha('#FF4C51', 0.12) : alpha('#56CA00', 0.12),
                            color: dn ? '#FF4C51' : '#4DB600',
                          }}
                        />
                      )}
                    </Box>
                    {stats.loading
                      ? <Skeleton width="55%" height={48} />
                      : <>
                          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.03em', color, lineHeight: 1, mb: 0.25, position: 'relative' }}>
                            {stats.error ? '—' : value}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.secondary', display: 'block' }}>
                            {title}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
                        </>
                    }
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

        </Box>
      </Paper>

      {/* ── Gestión disciplinaria ── */}
      <SectionBlock title="Gestión Disciplinaria y Administrativa" icon={<WarningIcon />} mb={3}>
        <Grid container spacing={2}>
          {mkCard('Apercibimientos',   stats.apercibimientos,   <WarningIcon />,     '#FFB400', deltas.apercibimientos,  '/disciplinary')}
          {mkCard('Sanciones Activas', stats.sancionesActivas, <AlertCircleIcon />, '#FF4C51', deltas.sancionesActivas, '/disciplinary')}
          {mkCard('Recibos Pendientes',stats.recibosPendientes,<ReceiptIcon />,     '#8C57FF', deltas.recibosPendientes,'/payroll')}
          {mkCard('Total Histórico',   stats.totalHistorico,   <TrendingIcon />,    '#16B1FF', deltas.totalHistorico,   '/disciplinary')}
        </Grid>
      </SectionBlock>

      {/* ── Acciones rápidas ── */}
      <SectionBlock title="Acciones Rápidas" icon={<UsersIcon />}>
        <Grid container spacing={1.5}>
          {quickActions.map(({ label, to, icon, bg, hover }) => (
            <Grid xs={12} sm={6} md={4} key={to}>
              <Button
                component={Link}
                to={to}
                variant="contained"
                fullWidth
                startIcon={icon}
                sx={{ py: 1.5, borderRadius: 2.5, bgcolor: bg, '&:hover': { bgcolor: hover }, color: '#fff' }}
              >
                {label}
              </Button>
            </Grid>
          ))}

          {/* WhatsApp presentismo */}
          <Grid xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={sendingReport ? <CircularProgress size={16} /> : <WhatsAppIcon />}
              disabled={sendingReport}
              onClick={handleSendPresentismoReport}
              sx={{ py: 1.5, borderRadius: 2.5, color: '#16A34A', borderColor: '#16A34A', '&:hover': { borderColor: '#15803D', bgcolor: 'rgba(22,163,74,0.06)' } }}
            >
              {sendingReport ? 'Preparando...' : 'Informe Presentismo'}
            </Button>
          </Grid>

          {/* Configurar destinatarios */}
          <Grid xs={12} sm={6} md={4}>
            <Button
              component={Link}
              to="/admin/presentismo/recipients"
              variant="outlined"
              fullWidth
              startIcon={<SettingsIcon />}
              sx={{ py: 1.5, borderRadius: 2.5 }}
            >
              Destinatarios Presentismo
            </Button>
          </Grid>
        </Grid>
      </SectionBlock>

      {/* ── Modal previsualización Presentismo ── */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Previsualización — Informe de Presentismo</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          {previewData ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Mes */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField
                  label="Mes del informe"
                  type="month"
                  value={modalMonth}
                  onChange={e => setModalMonth(e.target.value)}
                  size="small"
                  sx={{ maxWidth: 200 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={refreshPreview}
                  disabled={refreshingPreview}
                >
                  {refreshingPreview ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </Box>

              {/* Destinatario */}
              {Array.isArray(previewData.recipients) && previewData.recipients.length > 0 ? (
                <FormControl size="small" fullWidth>
                  <InputLabel>Destinatario</InputLabel>
                  <Select
                    value={selectedRecipientPhone}
                    label="Destinatario"
                    onChange={e => setSelectedRecipientPhone(e.target.value)}
                  >
                    {previewData.recipients.map((r, i) => (
                      <MenuItem key={i} value={r.phone}>
                        {r.name || r.roleLabel || r.phone} — {r.phone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : Array.isArray(previewData.destinations) && previewData.destinations.length > 0 ? (
                <FormControl size="small" fullWidth>
                  <InputLabel>Destinatario</InputLabel>
                  <Select value={selectedRecipientPhone} label="Destinatario" onChange={e => setSelectedRecipientPhone(e.target.value)}>
                    {previewData.destinations.map((p, i) => <MenuItem key={i} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : (
                <Alert severity="warning">No hay destinatario configurado. Configurá uno en Administración.</Alert>
              )}

              {/* Empleados sin presentismo */}
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Empleados sin presentismo: <Chip label={previewData.totalEmployees} size="small" color="warning" />
                </Typography>
                {Array.isArray(previewData.employees) && previewData.employees.length > 0 ? (
                  <List dense sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    {previewData.employees.map((e, i) => (
                      <ListItem key={i} divider={i < previewData.employees.length - 1}>
                        <ListItemText primary={`${e.apellido} ${e.nombre}`} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No se registran pérdidas de presentismo en el período.
                  </Typography>
                )}
              </Box>

              {/* Mensaje */}
              <Box
                sx={{
                  p: 2, bgcolor: 'background.default', borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  fontFamily: 'monospace', fontSize: '0.82rem',
                  whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
                }}
              >
                {previewData.message}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowPreview(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={confirmSendReport}
            disabled={sendingReport}
          >
            {sendingReport ? 'Enviando...' : 'Enviar por WhatsApp'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Componente interno: bloque de sección con título
const SectionBlock = ({ title, icon, children, mb = 0 }) => (
  <Paper
    variant="outlined"
    sx={{
      mb, borderRadius: 3.5, overflow: 'hidden', borderColor: 'divider',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05)',
    }}
  >
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={600} fontSize="0.9375rem">{title}</Typography>
    </Box>
    <Divider />
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>{children}</Box>
  </Paper>
);

export default Dashboard;
