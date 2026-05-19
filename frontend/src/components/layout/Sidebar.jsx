import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  WarningAmber as WarningIcon,
  AccessTime as ClockIcon,
  ReceiptLong as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { BRAND_NAME, BRAND_LOGO_PATH, BRAND_SUBTITLE } from '../../config/branding';
import { SIDEBAR_WIDTH } from '../../theme';
import { getCurrentUser } from '../../services/api';

const NAV_ITEMS = [
  { to: '/',                label: 'Dashboard',         icon: <DashboardIcon />, end: true },
  { to: '/employees',       label: 'Empleados',         icon: <PeopleIcon />    },
  { to: '/disciplinary',    label: 'Disciplinario',     icon: <WarningIcon />   },
  { to: '/attendance',      label: 'Asistencias',       icon: <ClockIcon />     },
  { to: '/payroll',         label: 'Recibos',           icon: <ReceiptIcon />   },
  { to: '/employee-account',label: 'Cuenta Corriente',  icon: <WalletIcon />    },
];

const NavItem = ({ to, label, icon, end, onNavigate }) => {
  const theme = useTheme();
  const p = theme.palette.primary.main;
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        component={NavLink}
        to={to}
        end={end}
        onClick={onNavigate}
        sx={{
          borderRadius: 2,
          py: 0.875,
          px: 2,
          color: 'text.secondary',
          '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 36 },
          '&.active': {
            background: `linear-gradient(270deg, ${alpha(p, 0.12)} 0%, ${alpha(p, 0.24)} 100%)`,
            color: 'primary.main',
            fontWeight: 600,
            '& .MuiListItemIcon-root': { color: 'primary.main' },
            '&::before': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: '12%',
              height: '76%',
              width: 3,
              borderRadius: '3px 0 0 3px',
              backgroundColor: p,
            },
            position: 'relative',
          },
          '&:hover': {
            bgcolor: 'action.hover',
            color: 'text.primary',
            '& .MuiListItemIcon-root': { color: 'text.primary' },
          },
          transition: 'all 0.15s ease',
        }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText
          primary={label}
          slotProps={{ primary: { fontSize: '0.9rem', fontWeight: 'inherit' } }}
        />
      </ListItemButton>
    </ListItem>
  );
};

const SidebarContent = ({ logout, onNavigate }) => {
  const theme = useTheme();
  const p = theme.palette.primary.main;
  const [logoOk, setLogoOk]       = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(data => { if (active) setCurrentUser(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const initials = currentUser?.nombre
    ? currentUser.nombre.charAt(0).toUpperCase()
    : (currentUser?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 34, height: 34, borderRadius: 2,
            background: `linear-gradient(135deg, ${p} 0%, ${alpha(p, 0.7)} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 10px ${alpha(p, 0.4)}`,
            flexShrink: 0,
          }}
        >
          {logoOk ? (
            <Box
              component="img"
              src={BRAND_LOGO_PATH}
              alt={BRAND_NAME}
              onError={() => setLogoOk(false)}
              sx={{ width: 22, height: 22, objectFit: 'contain' }}
            />
          ) : (
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {BRAND_NAME[0]}
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {BRAND_NAME}
          </Typography>
          {BRAND_SUBTITLE && (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              {BRAND_SUBTITLE}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Nav section label */}
      <Typography
        variant="overline"
        sx={{ px: 3, pt: 2.5, pb: 0.5, color: 'text.disabled', fontSize: '0.7rem', letterSpacing: '0.1em' }}
      >
        Menú
      </Typography>

      {/* Navigation */}
      <List sx={{ px: 1.5, flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </List>

      <Divider />

      {/* User card */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            p: 1.5, borderRadius: 2,
            bgcolor: alpha(p, 0.06),
            border: `1px solid ${alpha(p, 0.14)}`,
          }}
        >
          <Avatar
            sx={{
              width: 38, height: 38,
              background: `linear-gradient(135deg, ${p} 0%, ${theme.palette.info.main} 100%)`,
              fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {currentUser?.nombre || currentUser?.email || 'Usuario'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ textTransform: 'capitalize' }}>
              {currentUser?.role || 'Administrador'}
            </Typography>
          </Box>
          <Tooltip title="Cerrar sesión">
            <Box
              onClick={logout}
              sx={{
                cursor: 'pointer', color: 'text.secondary', display: 'flex',
                p: 0.5, borderRadius: 1,
                '&:hover': { color: 'error.main', bgcolor: 'rgba(255,76,81,0.08)' },
                transition: 'all 0.15s ease',
              }}
            >
              <LogoutIcon fontSize="small" />
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

const Sidebar = ({ isAuthenticated, logout, mobileOpen, onMobileClose }) => {
  if (!isAuthenticated) return null;

  const drawerSx = {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: SIDEBAR_WIDTH,
      boxSizing: 'border-box',
      borderRight: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      backgroundImage: 'none',
    },
  };

  return (
    <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, ...drawerSx }}
      >
        <SidebarContent logout={logout} onNavigate={onMobileClose} />
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: 'none', md: 'flex' }, ...drawerSx }}
      >
        <SidebarContent logout={logout} onNavigate={() => {}} />
      </Drawer>
    </Box>
  );
};

export default Sidebar;
