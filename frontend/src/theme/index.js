import { createTheme } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 240;

const PALETTE_SHARED = {
  primary:   { light: '#A379FF', main: '#8C57FF', dark: '#7E4EE6', contrastText: '#FFFFFF' },
  secondary: { light: '#A1A4A9', main: '#8A8D93', dark: '#7C7F84', contrastText: '#FFFFFF' },
  error:     { main: '#FF4C51', light: '#FF7074', dark: '#E64449' },
  warning:   { main: '#FFB400', light: '#FFC333', dark: '#E6A200' },
  info:      { main: '#16B1FF', light: '#45C1FF', dark: '#149FE6' },
  success:   { main: '#56CA00', light: '#78D533', dark: '#4DB600' },
};

const PALETTE_LIGHT = {
  ...PALETTE_SHARED,
  mode: 'light',
  background: { default: '#F4F5FA', paper: '#FFFFFF' },
  text: {
    primary:   'rgba(58, 53, 65, 0.87)',
    secondary: 'rgba(58, 53, 65, 0.60)',
    disabled:  'rgba(58, 53, 65, 0.38)',
  },
  divider: 'rgba(58, 53, 65, 0.12)',
  action: {
    active:             'rgba(58, 53, 65, 0.54)',
    hover:              'rgba(58, 53, 65, 0.04)',
    selected:           'rgba(58, 53, 65, 0.08)',
    disabled:           'rgba(58, 53, 65, 0.26)',
    disabledBackground: 'rgba(58, 53, 65, 0.12)',
  },
};

const PALETTE_DARK = {
  ...PALETTE_SHARED,
  mode: 'dark',
  background: { default: '#28243D', paper: '#312D4B' },
  text: {
    primary:   'rgba(231, 227, 252, 0.87)',
    secondary: 'rgba(231, 227, 252, 0.60)',
    disabled:  'rgba(231, 227, 252, 0.38)',
  },
  divider: 'rgba(231, 227, 252, 0.12)',
  action: {
    active:             'rgba(231, 227, 252, 0.54)',
    hover:              'rgba(231, 227, 252, 0.04)',
    selected:           'rgba(231, 227, 252, 0.08)',
    disabled:           'rgba(231, 227, 252, 0.26)',
    disabledBackground: 'rgba(231, 227, 252, 0.12)',
  },
};

const buildTheme = (mode = 'light') => {
  const palette = mode === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;
  const textMain = mode === 'dark' ? '231, 227, 252' : '58, 53, 65';
  const shadowColor = `rgba(${textMain}, `;

  return createTheme({
    palette,

    typography: {
      fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13.125,
      h1: { fontSize: '2.875rem', fontWeight: 500, lineHeight: 1.478 },
      h2: { fontSize: '2.375rem', fontWeight: 500, lineHeight: 1.474 },
      h3: { fontSize: '1.75rem',  fontWeight: 500, lineHeight: 1.5   },
      h4: { fontSize: '1.5rem',   fontWeight: 500, lineHeight: 1.583 },
      h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.556 },
      h6: { fontSize: '0.9375rem',fontWeight: 500, lineHeight: 1.467 },
      body1:     { fontSize: '0.9375rem', lineHeight: 1.467 },
      body2:     { fontSize: '0.8125rem', lineHeight: 1.538 },
      subtitle1: { fontSize: '0.9375rem', lineHeight: 1.467 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.538 },
      button:    { fontSize: '0.9375rem', lineHeight: 1.467, textTransform: 'none', fontWeight: 500 },
      caption:   { fontSize: '0.8125rem', lineHeight: 1.385, letterSpacing: '0.4px' },
      overline:  { fontSize: '0.75rem',   lineHeight: 1.167, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 500 },
    },

    shape: { borderRadius: 6 },

    shadows: [
      'none',
      `0px 2px 1px -1px ${shadowColor}0.2), 0px 1px 1px 0px ${shadowColor}0.14), 0px 1px 3px 0px ${shadowColor}0.12)`,
      `0px 3px 1px -2px ${shadowColor}0.2), 0px 2px 2px 0px ${shadowColor}0.14), 0px 1px 5px 0px ${shadowColor}0.12)`,
      `0px 3px 3px -2px ${shadowColor}0.2), 0px 3px 4px 0px ${shadowColor}0.14), 0px 1px 8px 0px ${shadowColor}0.12)`,
      `0px 2px 4px -1px ${shadowColor}0.2), 0px 4px 5px 0px ${shadowColor}0.14), 0px 1px 10px 0px ${shadowColor}0.12)`,
      `0px 3px 5px -1px ${shadowColor}0.2), 0px 5px 8px 0px ${shadowColor}0.14), 0px 1px 14px 0px ${shadowColor}0.12)`,
      `0px 3px 5px -1px ${shadowColor}0.2), 0px 6px 10px 0px ${shadowColor}0.14), 0px 1px 18px 0px ${shadowColor}0.12)`,
      `0px 4px 5px -2px ${shadowColor}0.2), 0px 7px 10px 1px ${shadowColor}0.14), 0px 2px 16px 1px ${shadowColor}0.12)`,
      `0px 5px 5px -3px ${shadowColor}0.2), 0px 8px 10px 1px ${shadowColor}0.14), 0px 3px 14px 2px ${shadowColor}0.12)`,
      `0px 5px 6px -3px ${shadowColor}0.2), 0px 9px 12px 1px ${shadowColor}0.14), 0px 3px 16px 2px ${shadowColor}0.12)`,
      `0px 6px 6px -3px ${shadowColor}0.2), 0px 10px 14px 1px ${shadowColor}0.14), 0px 4px 18px 3px ${shadowColor}0.12)`,
      `0px 6px 7px -4px ${shadowColor}0.2), 0px 11px 15px 1px ${shadowColor}0.14), 0px 4px 20px 3px ${shadowColor}0.12)`,
      `0px 7px 8px -4px ${shadowColor}0.2), 0px 12px 17px 2px ${shadowColor}0.14), 0px 5px 22px 4px ${shadowColor}0.12)`,
      `0px 7px 8px -4px ${shadowColor}0.2), 0px 13px 19px 2px ${shadowColor}0.14), 0px 5px 24px 4px ${shadowColor}0.12)`,
      `0px 7px 9px -4px ${shadowColor}0.2), 0px 14px 21px 2px ${shadowColor}0.14), 0px 5px 26px 4px ${shadowColor}0.12)`,
      `0px 8px 9px -5px ${shadowColor}0.2), 0px 15px 22px 2px ${shadowColor}0.14), 0px 6px 28px 5px ${shadowColor}0.12)`,
      `0px 8px 10px -5px ${shadowColor}0.2), 0px 16px 24px 2px ${shadowColor}0.14), 0px 6px 30px 5px ${shadowColor}0.12)`,
      `0px 8px 11px -5px ${shadowColor}0.2), 0px 17px 26px 2px ${shadowColor}0.14), 0px 6px 32px 5px ${shadowColor}0.12)`,
      `0px 9px 11px -5px ${shadowColor}0.2), 0px 18px 28px 2px ${shadowColor}0.14), 0px 7px 34px 6px ${shadowColor}0.12)`,
      `0px 9px 12px -6px ${shadowColor}0.2), 0px 19px 29px 2px ${shadowColor}0.14), 0px 7px 36px 6px ${shadowColor}0.12)`,
      `0px 10px 13px -6px ${shadowColor}0.2), 0px 20px 31px 3px ${shadowColor}0.14), 0px 8px 38px 7px ${shadowColor}0.12)`,
      `0px 10px 13px -6px ${shadowColor}0.2), 0px 21px 33px 3px ${shadowColor}0.14), 0px 8px 40px 7px ${shadowColor}0.12)`,
      `0px 10px 14px -6px ${shadowColor}0.2), 0px 22px 35px 3px ${shadowColor}0.14), 0px 8px 42px 7px ${shadowColor}0.12)`,
      `0px 11px 14px -7px ${shadowColor}0.2), 0px 23px 36px 3px ${shadowColor}0.14), 0px 9px 44px 8px ${shadowColor}0.12)`,
      `0px 11px 15px -7px ${shadowColor}0.2), 0px 24px 38px 3px ${shadowColor}0.14), 0px 9px 46px 8px ${shadowColor}0.12)`,
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            overflowX: 'hidden',
            scrollBehavior: 'smooth',
          },
        },
      },

      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? '#312D4B' : '#FFFFFF',
            color: mode === 'dark' ? 'rgba(231,227,252,0.87)' : 'rgba(58,53,65,0.87)',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(231,227,252,0.12)' : 'rgba(58,53,65,0.12)'}`,
          },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 3 },
        styleOverrides: {
          root: { borderRadius: 6, backgroundImage: 'none' },
        },
      },

      MuiCardHeader: {
        styleOverrides: {
          root: { padding: '1.25rem 1.5rem' },
          title: { fontSize: '1rem', fontWeight: 500 },
          subheader: { fontSize: '0.875rem' },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '1.25rem 1.5rem',
            '&:last-child': { paddingBottom: '1.25rem' },
          },
        },
      },

      MuiPaper: {
        defaultProps: { elevation: 3 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 6 },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            lineHeight: 1.71,
            padding: '0.5rem 1.375rem',
            textTransform: 'none',
          },
          sizeSmall: { padding: '0.25rem 0.875rem', borderRadius: 6 },
          sizeLarge: { padding: '0.75rem 1.875rem', borderRadius: 10 },
          contained: {
            boxShadow: '0px 4px 8px -4px rgba(140,87,255,0.42), 0px 2px 4px 0px rgba(140,87,255,0.14)',
            '&:hover': { boxShadow: '0px 6px 12px -4px rgba(140,87,255,0.52)' },
            '&:active': { boxShadow: 'none' },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'dark' ? 'rgba(231,227,252,0.22)' : 'rgba(58,53,65,0.22)',
            },
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 4, fontWeight: 500, fontSize: '0.75rem' },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 10 },
        },
      },

      MuiAlert: {
        styleOverrides: { root: { borderRadius: 8 } },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: 'rgba(140,87,255,0.16)',
              color: '#8C57FF',
              '&:hover': { backgroundColor: 'rgba(140,87,255,0.24)' },
            },
          },
        },
      },

      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'dark' ? '#F7F4FF' : '#1A0E33',
            color:           mode === 'dark' ? '#1A0E33' : '#F7F4FF',
            borderRadius: 6,
          },
          arrow: { color: mode === 'dark' ? '#F7F4FF' : '#1A0E33' },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? 'rgba(231,227,252,0.12)' : 'rgba(58,53,65,0.12)',
          },
        },
      },
    },
  });
};

export default buildTheme;
