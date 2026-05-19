import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography, Divider, useMediaQuery, useTheme } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate, useLocation } from 'react-router-dom';
import { monthsList } from '../context/AppContext';

const DrawerContent = ({ onItemClick, collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: 'Dashboard Overview', path: '/', icon: <DashboardIcon /> },
    ...monthsList.map((month, index) => ({
      title: month,
      path: `/month/${index}`,
      icon: <CalendarMonthIcon />
    }))
  ];

  return (
    <>
      <Toolbar sx={{ py: 2, justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 2, transition: 'all 0.3s ease' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            backgroundColor: 'secondary.main',
            borderRadius: '50%', p: 1, display: 'flex',
            boxShadow: '0 0 15px rgba(255, 143, 0, 0.4)',
            flexShrink: 0
          }}>
            <AccountBalanceIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          {!collapsed && (
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5, color: '#fff', whiteSpace: 'nowrap' }}>
              BALAJI POOL
            </Typography>
          )}
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

      <Box sx={{ overflowX: 'hidden', overflowY: 'auto', px: collapsed ? 1 : 1.5 }}>
        <List>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => { navigate(item.path); onItemClick?.(); }}
                  sx={{
                    borderRadius: 2, 
                    py: 1,
                    px: collapsed ? 0 : 2,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                    '&::before': {
                      content: '""', position: 'absolute',
                      left: 0, top: 0, bottom: 0, width: 4,
                      backgroundColor: 'secondary.main',
                      transform: isSelected ? 'scaleY(1)' : 'scaleY(0)',
                      transition: 'transform 0.2s ease',
                      borderTopRightRadius: 4, borderBottomRightRadius: 4,
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
                    },
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)', transform: collapsed ? 'none' : 'translateX(4px)' }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isSelected ? 'secondary.main' : 'rgba(255,255,255,0.5)', 
                    minWidth: 0, 
                    mr: collapsed ? 0 : 2,
                    justifyContent: 'center',
                    transition: 'all 0.2s ease' 
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                        transition: 'color 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </>
  );
};

const Sidebar = ({ mobileOpen, onClose, collapsed, drawerWidth = 240 }) => {
  const theme = useTheme();

  return (
    <Box component="nav" sx={{ 
      width: { md: drawerWidth }, 
      flexShrink: { md: 0 }, 
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }) 
    }}>
      {/* Mobile: Temporary Drawer (hamburger-triggered) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' }
        }}
      >
        <DrawerContent onItemClick={onClose} collapsed={false} />
      </Drawer>

      {/* Desktop: Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            borderRight: 'none',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            })
          }
        }}
        open
      >
        <DrawerContent collapsed={collapsed} />
      </Drawer>
    </Box>
  );
};

export default Sidebar;
