import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, Typography, Button, LinearProgress,
  Card, CardContent, Select, MenuItem, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  IconButton, useMediaQuery, useTheme, Tooltip
} from '@mui/material';
import { useAppContext } from '../context/AppContext';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const drawerWidth = 240;

const MetricCard = ({ title, value, icon, gradient }) => (
  <Card sx={{
    minWidth: 160,
    mx: 1,
    background: gradient,
    color: '#fff',
    border: 'none',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    flexShrink: 0,
  }}>
    <CardContent sx={{ p: '12px !important', display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, p: 0.75, display: 'flex', flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { fontSize: 22 } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', opacity: 0.9, lineHeight: 1 }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.2, lineHeight: 1.2, fontSize: '1.1rem' }}>
          ₹{value.toLocaleString()}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const Header = ({ onMenuClick, drawerWidth = 240, collapsed }) => {
  const { isAdmin, logout, metrics, availableYears, currentYear, setCurrentYear, addYear } = useAppContext();
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [newYear, setNewYear] = useState('');
  const [yearError, setYearError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleAddYear = async () => {
    const yearInt = parseInt(newYear, 10);
    if (!newYear || isNaN(yearInt) || yearInt < 2000 || yearInt > 2100) {
      setYearError('Please enter a valid year (2000–2100)');
      return;
    }
    const result = await addYear(yearInt);
    if (result.success) {
      setAddYearOpen(false);
      setNewYear('');
      setYearError('');
    } else {
      setYearError(result.error || 'Failed to add year');
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, md: `${drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 1, gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          {/* Left side: Hamburger (mobile) + Title (mobile) / Metric cards (desktop) */}
          <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, gap: 0.5 }}>
            {/* Hamburger menu / Arrow Icon */}
            <IconButton edge="start" onClick={onMenuClick} sx={{ color: 'text.primary', mr: 1, flexShrink: 0 }}>
              {isMobile ? <MenuIcon /> : (collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />)}
            </IconButton>

            {/* Mobile Title */}
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 800, 
                color: 'primary.main', 
                display: { xs: 'block', md: 'none' },
                letterSpacing: 0.5,
                mr: 1.5,
                whiteSpace: 'nowrap'
              }}
            >
              BALAJI POOL
            </Typography>

            {/* Desktop Metric Cards Row */}
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0,
              flexShrink: 1,
            }}>
              <MetricCard
                title="Total Goal"
                value={metrics.totalGoal}
                icon={<AccountBalanceWalletIcon />}
                gradient="linear-gradient(135deg, #BF360C 0%, #3E2723 100%)"
              />
              <MetricCard
                title="Collected"
                value={metrics.collectedSoFar}
                icon={<TrendingUpIcon />}
                gradient="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
              />

              {/* Progress bar */}
              <Box sx={{ ml: 2, width: 180, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Goal Progress</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {metrics.percentAchieved.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(metrics.percentAchieved, 100)}
                  sx={{
                    height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': {
                      background: metrics.percentAchieved >= 100
                        ? 'linear-gradient(90deg, #00E676 0%, #00C853 100%)'
                        : 'linear-gradient(90deg, #FFB74D 0%, #FF9800 100%)'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Year Selector (Always Visible) */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 'auto', md: 2 }, mr: { xs: 1, md: 0 }, gap: 1, flexShrink: 0 }}>
              <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  {availableYears.map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {isAdmin && (
                <Tooltip title="Add new year">
                  <IconButton
                    size="small"
                    onClick={() => setAddYearOpen(true)}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Right side: Logout */}
          <Box sx={{ flexShrink: 0 }}>
            {isAdmin && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={logout}
                size="small"
                sx={{
                  borderRadius: 8, borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                Exit Admin Mode
              </Button>
            )}
            {isAdmin && (
              <IconButton
                color="error"
                onClick={logout}
                sx={{ display: { xs: 'flex', sm: 'none' } }}
              >
                <LogoutIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Add Year Dialog */}
      <Dialog
        open={addYearOpen}
        onClose={() => { setAddYearOpen(false); setYearError(''); setNewYear(''); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>Add New Year</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will initialize empty ledger records for all members in the new year.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Year (e.g. 2027)"
            type="number"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddYear()}
            autoFocus
          />
          {yearError && <Alert severity="error" sx={{ mt: 1 }}>{yearError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddYearOpen(false); setYearError(''); setNewYear(''); }} variant="outlined">Cancel</Button>
          <Button onClick={handleAddYear} variant="contained">Add Year</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;
