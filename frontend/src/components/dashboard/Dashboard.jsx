import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Button, Paper, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  List, ListItem, ListItemText, Chip, CircularProgress, Alert,
} from '@mui/material';
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
    { label: 'Nuevo Empleado',       to: '/employees/new',    icon: <PersonAddIcon />,   color: 'primary'   },
    { label: 'Registrar Asistencia', to: '/attendance',       icon: <AttendanceIcon />,  color: 'success'   },
    { label: 'Nueva Disciplinaria',  to: '/disciplinary/new', icon: <DisciplinaryIcon />,color: 'warning'   },
    { label: 'Nuevo Recibo',         to: '/payroll/new',      icon: <ReceiptIcon />,     color: 'info'      },
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

      {/* ── Métricas de personal ── */}
      <SectionBlock title="Métricas de Personal" icon={<UsersIcon />} mb={3}>
        <Grid container spacing={2}>
          {mkCard('Empleados Activos',  stats.empleadosActivos,  <UsersIcon />,    '#56CA00', deltas.empleadosActivos)}
          {mkCard('Inasistencias (Mes)',stats.inasistenciasMes,  <CalendarXIcon />, '#FF4C51', deltas.inasistenciasMes)}
          {mkCard('Tardanzas (Mes)',    stats.tardanzasMes,      <ClockIcon />,    '#FFB400', deltas.tardanzasMes)}
          {mkCard('Sin Presentismo',    stats.sinPresentismo,    <PersonOffIcon />, '#8A8D93', deltas.sinPresentismo)}
        </Grid>
      </SectionBlock>

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
          {quickActions.map(({ label, to, icon, color }) => (
            <Grid item xs={12} sm={6} md={4} key={to}>
              <Button
                component={Link}
                to={to}
                variant="contained"
                color={color}
                fullWidth
                startIcon={icon}
                sx={{ py: 1.5, borderRadius: 2.5 }}
              >
                {label}
              </Button>
            </Grid>
          ))}

          {/* WhatsApp presentismo */}
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
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
