import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton, Divider,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  TaskAlt as CheckIcon,
} from '@mui/icons-material';
import { login } from '../../services/api';
import { BRAND_NAME, BRAND_LOGO_PATH, BRAND_SUBTITLE } from '../../config/branding';

const features = [
  'Gestión completa de empleados y legajos',
  'Control de asistencia y licencias',
  'Liquidaciones y recibos de haberes',
  'Cuenta corriente y adelantos',
];

const Login = ({ login: loginUser }) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const { email, password } = formData;
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login({ email, password });
      loginUser(data.token);
      try {
        import('../../components/dashboard/Dashboard');
        const api = await import('../../services/api');
        api.getDashboardMetrics().catch(() => {});
      } catch (_) {}
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas. Verificá tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const primary      = theme.palette.primary.main;
  const panelText    = theme.palette.primary.contrastText;  // #fff in light, #0D0D0D in dark
  const panelTextMid = alpha(panelText, 0.72);
  const panelOverlay = alpha(panelText, 0.10);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      {/* ── Left decorative panel (hidden on mobile) ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 45%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: primary,
          backgroundImage: `
            radial-gradient(ellipse at 20% 80%, ${alpha(panelText, 0.12)} 0%, transparent 55%),
            radial-gradient(ellipse at 80% 10%, ${alpha(panelText, 0.08)} 0%, transparent 50%)
          `,
          p: 6,
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: panelOverlay }} />
        <Box sx={{ position: 'absolute', bottom: -100, left: -60, width: 360, height: 360, borderRadius: '50%', bgcolor: alpha(panelText, 0.05) }} />
        <Box sx={{ position: 'absolute', top: '35%', right: -40, width: 160, height: 160, borderRadius: '50%', bgcolor: alpha(panelText, 0.07) }} />

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          {/* Logo */}
          <Box
            component="img"
            src={BRAND_LOGO_PATH}
            alt={BRAND_NAME}
            onError={e => { e.currentTarget.style.display = 'none'; }}
            sx={{ width: 72, height: 72, borderRadius: 3, mb: 3, mx: 'auto', display: 'block', objectFit: 'contain', bgcolor: alpha(panelText, 0.15), p: 1 }}
          />

          <Typography variant="h4" fontWeight={800} color={panelText} letterSpacing="-0.02em" mb={1}>
            {BRAND_NAME}
          </Typography>
          <Typography variant="body1" sx={{ color: panelTextMid, mb: 4 }}>
            {BRAND_SUBTITLE}
          </Typography>

          <Divider sx={{ borderColor: alpha(panelText, 0.2), mb: 4 }} />

          {/* Feature list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, textAlign: 'left' }}>
            {features.map(f => (
              <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckIcon sx={{ color: panelTextMid, fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: panelTextMid }}>{f}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Right form panel ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle background glow */}
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(primary, isDark ? 0.14 : 0.08)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

          {/* Mobile logo (only on small screens) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
            <Box
              component="img"
              src={BRAND_LOGO_PATH}
              alt={BRAND_NAME}
              onError={e => { e.currentTarget.style.display = 'none'; }}
              sx={{ width: 56, height: 56, borderRadius: 2.5, mb: 1.5, objectFit: 'contain', bgcolor: alpha(primary, 0.1), p: 0.75 }}
            />
            <Typography variant="h6" fontWeight={800}>{BRAND_NAME}</Typography>
          </Box>

          {/* Heading */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresá tus credenciales para acceder al sistema
            </Typography>
          </Box>

          {/* Error alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              fullWidth
              autoComplete="email"
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Contraseña"
              type={showPwd ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={onChange}
              required
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd(v => !v)} edge="end">
                        {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{
                mt: 0.5,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 2.5,
                letterSpacing: '0.02em',
                boxShadow: `0 4px 20px ${alpha(primary, 0.4)}`,
                '&:hover': {
                  boxShadow: `0 6px 24px ${alpha(primary, 0.55)}`,
                },
              }}
            >
              {loading
                ? <CircularProgress size={22} color="inherit" />
                : 'Iniciar Sesión'}
            </Button>
          </Box>

          {/* Footer note */}
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', textAlign: 'center', mt: 4 }}
          >
            © {new Date().getFullYear()} {BRAND_NAME} · Sistema de Gestión de RRHH
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
