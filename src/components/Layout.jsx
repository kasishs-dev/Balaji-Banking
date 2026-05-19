import React, { useState } from 'react';
import { Box, Toolbar, CssBaseline, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useAppContext } from '../context/AppContext';

const Layout = () => {
  const { loading } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const drawerWidth = sidebarCollapsed ? 72 : 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Header onMenuClick={handleDrawerToggle} drawerWidth={drawerWidth} collapsed={sidebarCollapsed} />
      <Sidebar 
        mobileOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        collapsed={sidebarCollapsed && !isMobile}
        drawerWidth={drawerWidth}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          backgroundColor: 'background.default',
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Outlet />
          )}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
