import React from 'react';
import {
  AppBar, Toolbar, IconButton, Box, Button, Avatar, Typography, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_WIDTH } from '../../theme';
import { BRAND_NAME, BRAND_LOGO_PATH } from '../../config/branding';

const Navbar = ({ isAuthenticated, logout, onMobileMenuToggle, colorMode, onToggleColorMode, currentUser }) => {
  const [logoOk, setLogoOk] = React.useState(true);

  const ModeToggle = () => (
    <Tooltip title={colorMode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
      <IconButton onClick={onToggleColorMode} size="small">
        {colorMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );

  if (isAuthenticated) {
    const initials = currentUser?.nombre
      ? currentUser.nombre.charAt(0).toUpperCase()
      : 'U';
    const roleLabel = currentUser?.role === 'admin' ? 'Admin' : currentUser?.role || '';

    return (
      <AppBar
        position="sticky"
        sx={{
          ml: { md: `${SIDEBAR_WIDTH}px` },
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          zIndex: (t) => t.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
          <IconButton
            edge="start"
            onClick={onMobileMenuToggle}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* User greeting — desktop only */}
          {currentUser && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32, height: 32, fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, #8C57FF 0%, #16B1FF 100%)',
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {currentUser.nombre || currentUser.email}
                </Typography>
                {roleLabel && (
                  <Typography variant="caption" color="text.secondary" lineHeight={1}>
                    {roleLabel}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1 }} />
          <ModeToggle />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="sticky" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
      <Toolbar sx={{ gap: 1, px: { xs: 2, sm: 3 } }}>
        <Box
          component={NavLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'text.primary' }}
        >
          {logoOk ? (
            <Box
              component="img"
              src={BRAND_LOGO_PATH}
              alt={BRAND_NAME}
              onError={() => setLogoOk(false)}
              sx={{ width: 28, height: 28, borderRadius: 1.5, objectFit: 'contain' }}
            />
          ) : (
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 14 }}>
              {BRAND_NAME[0]}
            </Avatar>
          )}
          <Typography variant="subtitle1" fontWeight={700} noWrap>{BRAND_NAME}</Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <ModeToggle />
        <Button
          component={NavLink}
          to="/login"
          startIcon={<LoginIcon />}
          variant="text"
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          Iniciar Sesión
        </Button>
        <Button
          component={NavLink}
          to="/register"
          startIcon={<PersonAddIcon />}
          variant="contained"
          size="small"
        >
          Registrarse
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
