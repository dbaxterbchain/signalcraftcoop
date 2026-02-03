import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1677C8',
      dark: '#0A2A43',
      light: '#52B9FF',
    },
    secondary: {
      main: '#0E1116',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F4F8FB',
    },
    divider: '#C5D6E5',
    text: {
      primary: '#0A2A43',
      secondary: '#6B7B8C',
    },
    info: { main: '#3B82F6' },
    success: { main: '#12B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Inter", "Segoe UI", Arial, sans-serif',
    h1: { fontSize: 36, lineHeight: '44px', fontWeight: 700 },
    h2: { fontSize: 28, lineHeight: '36px', fontWeight: 600 },
    h3: { fontSize: 22, lineHeight: '30px', fontWeight: 600 },
    h4: { fontSize: 20, lineHeight: '28px', fontWeight: 600 },
    body1: { fontSize: 16, lineHeight: '24px', fontWeight: 400 },
    body2: { fontSize: 14, lineHeight: '20px', fontWeight: 400 },
    button: { fontSize: 14, lineHeight: '16px', fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #C5D6E5',
          boxShadow: '0 6px 24px rgba(10, 42, 67, 0.12)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;
