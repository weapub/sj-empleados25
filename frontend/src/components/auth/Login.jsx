import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { login } from '../../services/api';
import { BRAND_NAME, BRAND_LOGO_PATH } from '../../config/branding';

const Login = ({ login: loginUser }) => {
  const theme = useTheme();
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: `radial-gradient(ellipse at 60% 0%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 65%)`,
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src={BRAND_LOGO_PATH}
            alt={BRAND_NAME}
            onError={e => { e.currentTarget.style.display = 'none'; }}
            sx={{ width: 52, height: 52, borderRadius: 2.5, mb: 2, mx: 'auto', display: 'block', objectFit: 'contain' }}
          />
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
            Bienvenido
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Ingresá tus credenciales para continuar
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                fullWidth
                autoComplete="email"
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
                sx={{ mt: 0.5, py: 1.5 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Iniciar Sesión'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
