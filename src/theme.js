import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#E65100', // Dark Orange
      light: '#FF833A',
      dark: '#AC1900',
    },
    secondary: {
      main: '#FF8F00', // Amber/Orange
      light: '#FFC046',
      dark: '#C56000',
    },
    background: {
      default: '#F0F4F8', // Slightly cool off-white for depth
      paper: '#FFFFFF',
    },
    success: {
      main: '#00E676', // Bright neon green
    },
    error: {
      main: '#FF1744', // Vivid red
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    }
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '8px 24px',
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #E65100 0%, #FF833A 100%)',
          boxShadow: '0 4px 14px 0 rgba(230, 81, 0, 0.39)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF833A 0%, #E65100 100%)',
            boxShadow: '0 6px 20px rgba(230, 81, 0, 0.23)',
            transform: 'translateY(-1px)',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.8)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#AC1900',
          backgroundImage: 'linear-gradient(180deg, #AC1900 0%, #E65100 100%)',
          color: '#FFFFFF',
          borderRight: 'none',
          boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          color: '#1E293B',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E2E8F0',
          padding: '16px',
        },
        head: {
          fontWeight: 700,
          backgroundColor: '#F8FAFC',
          color: '#475569',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 8,
        }
      }
    }
  },
});

export default theme;
