import { createTheme } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 240;

// ── Dark mode deep navy palette ───────────────────────────────────────────────
const DARK_BG_DEFAULT = '#13152A';   // deep navy-charcoal
const DARK_BG_PAPER   = '#1C1F3A';   // slightly lighter navy
const DARK_TEXT_RGB   = '210, 214, 250';  // cool white with blue tint
const DARK_PRIMARY    = '#8C57FF';   // violet (matches accent buttons)
const DARK_P_LIGHT    = '#A379FF';   // light violet
const DARK_P_DARK     = '#7E4EE6';   // deep violet
const DARK_INFO       = '#16B1FF';   // cyan-blue
const DARK_ERROR      = '#FF4C51';   // red

// ── Light mode palette ────────────────────────────────────────────────────────
const LIGHT_TEXT_RGB  = '58, 53, 65';

const PALETTE_LIGHT = {
  mode: 'light',
  primary:   { light: '#A379FF', main: '#8C57FF', dark: '#7E4EE6', contrastText: '#FFFFFF' },
  secondary: { light: '#A1A4A9', main: '#8A8D93', dark: '#7C7F84', contrastText: '#FFFFFF' },
  error:     { main: '#FF4C51', light: '#FF7074', dark: '#E64449', contrastText: '#FFFFFF' },
  warning:   { main: '#FFB400', light: '#FFC333', dark: '#E6A200', contrastText: '#FFFFFF' },
  info:      { main: '#16B1FF', light: '#45C1FF', dark: '#149FE6', contrastText: '#FFFFFF' },
  success:   { main: '#56CA00', light: '#78D533', dark: '#4DB600', contrastText: '#FFFFFF' },
  background: { default: '#F4F5FA', paper: '#FFFFFF' },
  text: {
    primary:   `rgba(${LIGHT_TEXT_RGB}, 0.87)`,
    secondary: `rgba(${LIGHT_TEXT_RGB}, 0.60)`,
    disabled:  `rgba(${LIGHT_TEXT_RGB}, 0.38)`,
  },
  divider: `rgba(${LIGHT_TEXT_RGB}, 0.12)`,
  action: {
    active:             `rgba(${LIGHT_TEXT_RGB}, 0.54)`,
    hover:              `rgba(${LIGHT_TEXT_RGB}, 0.04)`,
    selected:           `rgba(${LIGHT_TEXT_RGB}, 0.08)`,
    disabled:           `rgba(${LIGHT_TEXT_RGB}, 0.26)`,
    disabledBackground: `rgba(${LIGHT_TEXT_RGB}, 0.12)`,
  },
};

const PALETTE_DARK = {
  mode: 'dark',
  primary:   { light: DARK_P_LIGHT, main: DARK_PRIMARY, dark: DARK_P_DARK, contrastText: '#FFFFFF' },
  secondary: { light: '#A1A4A9',    main: '#8A8D93',    dark: '#7C7F84',   contrastText: '#FFFFFF' },
  error:     { main: DARK_ERROR,    light: '#FF7074',   dark: '#E64449',   contrastText: '#FFFFFF' },
  warning:   { main: '#FFB400',     light: '#FFC333',   dark: '#E6A200',   contrastText: '#13152A' },
  info:      { main: DARK_INFO,     light: '#45C1FF',   dark: '#149FE6',   contrastText: '#FFFFFF' },
  success:   { main: '#56CA00',     light: '#78D533',   dark: '#4DB600',   contrastText: '#FFFFFF' },
  background: { default: DARK_BG_DEFAULT, paper: DARK_BG_PAPER },
  text: {
    primary:   `rgba(${DARK_TEXT_RGB}, 0.90)`,
    secondary: `rgba(${DARK_TEXT_RGB}, 0.58)`,
    disabled:  `rgba(${DARK_TEXT_RGB}, 0.34)`,
  },
  divider: `rgba(${DARK_TEXT_RGB}, 0.10)`,
  action: {
    active:             `rgba(${DARK_TEXT_RGB}, 0.54)`,
    hover:              `rgba(${DARK_TEXT_RGB}, 0.05)`,
    selected:           `rgba(${DARK_TEXT_RGB}, 0.09)`,
    disabled:           `rgba(${DARK_TEXT_RGB}, 0.26)`,
    disabledBackground: `rgba(${DARK_TEXT_RGB}, 0.12)`,
  },
};

const buildTheme = (mode = 'light') => {
  const isDark   = mode === 'dark';
  const palette  = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const textRGB  = isDark ? DARK_TEXT_RGB : LIGHT_TEXT_RGB;
  const sc       = `rgba(${textRGB}, `;   // shadow color prefix

  // Component token shortcuts
  const appBarBg      = isDark ? DARK_BG_PAPER   : '#FFFFFF';
  const appBarColor   = isDark ? `rgba(${DARK_TEXT_RGB}, 0.87)` : `rgba(${LIGHT_TEXT_RGB}, 0.87)`;
  const borderColor   = isDark ? `rgba(${DARK_TEXT_RGB}, 0.10)` : `rgba(${LIGHT_TEXT_RGB}, 0.12)`;
  const inputBorder   = isDark ? `rgba(${DARK_TEXT_RGB}, 0.20)` : `rgba(${LIGHT_TEXT_RGB}, 0.22)`;
  const tooltipBg     = isDark ? '#E8E6FF' : '#1A0E33';
  const tooltipColor  = isDark ? '#13152A' : '#E8E6FF';
  const selectedBg    = isDark ? 'rgba(140,87,255,0.16)' : 'rgba(140,87,255,0.16)';
  const selectedColor = '#8C57FF';
  const selectedHover = 'rgba(140,87,255,0.24)';
  const btnShadow     = isDark
    ? `0px 4px 8px -4px rgba(140,87,255,0.50), 0px 2px 4px 0px rgba(140,87,255,0.18)`
    : `0px 4px 8px -4px rgba(140,87,255,0.42), 0px 2px 4px 0px rgba(140,87,255,0.14)`;
  const btnShadowHover = isDark
    ? `0px 6px 12px -4px rgba(140,87,255,0.65)`
    : `0px 6px 12px -4px rgba(140,87,255,0.52)`;

  return createTheme({
    palette,

    typography: {
      fontFamily: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13.125,
      h1: { fontSize: '2.875rem', fontWeight: 500, lineHeight: 1.478, '@media (max-width:599px)': { fontSize: '2rem' } },
      h2: { fontSize: '2.375rem', fontWeight: 500, lineHeight: 1.474, '@media (max-width:599px)': { fontSize: '1.75rem' } },
      h3: { fontSize: '1.75rem',  fontWeight: 500, lineHeight: 1.5,   '@media (max-width:599px)': { fontSize: '1.375rem' } },
      h4: { fontSize: '1.5rem',   fontWeight: 500, lineHeight: 1.583, '@media (max-width:599px)': { fontSize: '1.2rem' } },
      h5: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.556, '@media (max-width:599px)': { fontSize: '1rem' } },
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
      `0px 2px 1px -1px ${sc}0.2), 0px 1px 1px 0px ${sc}0.14), 0px 1px 3px 0px ${sc}0.12)`,
      `0px 3px 1px -2px ${sc}0.2), 0px 2px 2px 0px ${sc}0.14), 0px 1px 5px 0px ${sc}0.12)`,
      `0px 3px 3px -2px ${sc}0.2), 0px 3px 4px 0px ${sc}0.14), 0px 1px 8px 0px ${sc}0.12)`,
      `0px 2px 4px -1px ${sc}0.2), 0px 4px 5px 0px ${sc}0.14), 0px 1px 10px 0px ${sc}0.12)`,
      `0px 3px 5px -1px ${sc}0.2), 0px 5px 8px 0px ${sc}0.14), 0px 1px 14px 0px ${sc}0.12)`,
      `0px 3px 5px -1px ${sc}0.2), 0px 6px 10px 0px ${sc}0.14), 0px 1px 18px 0px ${sc}0.12)`,
      `0px 4px 5px -2px ${sc}0.2), 0px 7px 10px 1px ${sc}0.14), 0px 2px 16px 1px ${sc}0.12)`,
      `0px 5px 5px -3px ${sc}0.2), 0px 8px 10px 1px ${sc}0.14), 0px 3px 14px 2px ${sc}0.12)`,
      `0px 5px 6px -3px ${sc}0.2), 0px 9px 12px 1px ${sc}0.14), 0px 3px 16px 2px ${sc}0.12)`,
      `0px 6px 6px -3px ${sc}0.2), 0px 10px 14px 1px ${sc}0.14), 0px 4px 18px 3px ${sc}0.12)`,
      `0px 6px 7px -4px ${sc}0.2), 0px 11px 15px 1px ${sc}0.14), 0px 4px 20px 3px ${sc}0.12)`,
      `0px 7px 8px -4px ${sc}0.2), 0px 12px 17px 2px ${sc}0.14), 0px 5px 22px 4px ${sc}0.12)`,
      `0px 7px 8px -4px ${sc}0.2), 0px 13px 19px 2px ${sc}0.14), 0px 5px 24px 4px ${sc}0.12)`,
      `0px 7px 9px -4px ${sc}0.2), 0px 14px 21px 2px ${sc}0.14), 0px 5px 26px 4px ${sc}0.12)`,
      `0px 8px 9px -5px ${sc}0.2), 0px 15px 22px 2px ${sc}0.14), 0px 6px 28px 5px ${sc}0.12)`,
      `0px 8px 10px -5px ${sc}0.2), 0px 16px 24px 2px ${sc}0.14), 0px 6px 30px 5px ${sc}0.12)`,
      `0px 8px 11px -5px ${sc}0.2), 0px 17px 26px 2px ${sc}0.14), 0px 6px 32px 5px ${sc}0.12)`,
      `0px 9px 11px -5px ${sc}0.2), 0px 18px 28px 2px ${sc}0.14), 0px 7px 34px 6px ${sc}0.12)`,
      `0px 9px 12px -6px ${sc}0.2), 0px 19px 29px 2px ${sc}0.14), 0px 7px 36px 6px ${sc}0.12)`,
      `0px 10px 13px -6px ${sc}0.2), 0px 20px 31px 3px ${sc}0.14), 0px 8px 38px 7px ${sc}0.12)`,
      `0px 10px 13px -6px ${sc}0.2), 0px 21px 33px 3px ${sc}0.14), 0px 8px 40px 7px ${sc}0.12)`,
      `0px 10px 14px -6px ${sc}0.2), 0px 22px 35px 3px ${sc}0.14), 0px 8px 42px 7px ${sc}0.12)`,
      `0px 11px 14px -7px ${sc}0.2), 0px 23px 36px 3px ${sc}0.14), 0px 9px 44px 8px ${sc}0.12)`,
      `0px 11px 15px -7px ${sc}0.2), 0px 24px 38px 3px ${sc}0.14), 0px 9px 46px 8px ${sc}0.12)`,
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
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: appBarBg,
            color: appBarColor,
            boxShadow: 'none',
            borderBottom: `1px solid ${borderColor}`,
          },
          colorDefault: {
            backgroundColor: appBarBg,
            color: appBarColor,
          },
          colorPrimary: {
            backgroundColor: appBarBg,
            color: appBarColor,
          },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 3 },
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundImage: 'none',
            ...(isDark && { border: `1px solid rgba(${DARK_TEXT_RGB}, 0.08)` }),
          },
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
          root: {
            backgroundImage: 'none',
            ...(isDark && { borderColor: `rgba(${DARK_TEXT_RGB}, 0.08)` }),
          },
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
            boxShadow: btnShadow,
            '&:hover': { boxShadow: btnShadowHover },
            '&:active': { boxShadow: 'none' },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorder,
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
              backgroundColor: selectedBg,
              color: selectedColor,
              '&:hover': { backgroundColor: selectedHover },
            },
          },
        },
      },

      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: tooltipBg,
            color: tooltipColor,
            borderRadius: 6,
          },
          arrow: { color: tooltipBg },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: { borderColor: borderColor },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            ...(isDark && {
              '& .MuiTableCell-head': {
                backgroundColor: `rgba(${DARK_TEXT_RGB}, 0.04)`,
              },
            }),
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            ...(isDark && {
              '&:hover': {
                backgroundColor: `rgba(${DARK_TEXT_RGB}, 0.04) !important`,
              },
            }),
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: isDark ? DARK_PRIMARY : undefined,
              '& + .MuiSwitch-track': {
                backgroundColor: isDark ? DARK_PRIMARY : undefined,
              },
            },
          },
        },
      },
    },
  });
};

export default buildTheme;
