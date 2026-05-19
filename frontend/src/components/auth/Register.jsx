import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { register } from '../../services/api';
import { BRAND_NAME, BRAND_LOGO_PATH } from '../../config/branding';

const Register = ({ login: loginUser }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', password2: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const { nombre, email, password, password2 } = formData;
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== password2) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await register({ nombre, email, password });
      loginUser(data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const primary = theme.palette.primary.main;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: { xs: 2.5, sm: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: 420, height: 420, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(primary, theme.palette.mode === 'dark' ? 0.14 : 0.08)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute', bottom: '-8%', left: '-8%',
          width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(primary, 0.06)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src={BRAND_LOGO_PATH}
            alt={BRAND_NAME}
            onError={e => { e.currentTarget.style.display = 'none'; }}
            sx={{ width: 52, height: 52, borderRadius: 2.5, mb: 1.5, mx: 'auto', display: 'block', objectFit: 'contain', bgcolor: alpha(primary, 0.1), p: 0.75 }}
          />
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">{BRAND_NAME}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em" gutterBottom>
            Crear cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completá tus datos para registrarte en el sistema
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Nombre"
            name="nombre"
            value={nombre}
            onChange={onChange}
            required
            fullWidth
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

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

          <TextField
            label="Confirmar Contraseña"
            type={showPwd2 ? 'text' : 'password'}
            name="password2"
            value={password2}
            onChange={onChange}
            required
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd2(v => !v)} edge="end">
                      {showPwd2 ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
            startIcon={loading ? null : <PersonAddIcon />}
            sx={{
              mt: 0.5, py: 1.5, fontSize: '1rem', fontWeight: 700,
              borderRadius: 2.5, letterSpacing: '0.02em',
              boxShadow: `0 4px 20px ${alpha(primary, 0.4)}`,
              '&:hover': { boxShadow: `0 6px 24px ${alpha(primary, 0.55)}` },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          ¿Ya tenés cuenta?{' '}
          <Box component={Link} to="/login" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
            Iniciar Sesión
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;
