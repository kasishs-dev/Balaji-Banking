import React, { useState } from "react";
import {
  Box,
  Toolbar,
  CssBaseline,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Typography,
} from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { useAppContext } from "../context/AppContext";

const Layout = () => {
  const { loading } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Different drawer widths for mobile and desktop
  const desktopDrawerWidth = sidebarCollapsed ? 72 : 280;
  const mobileDrawerWidth = 180; // Smaller width for mobile
  const drawerWidth = isMobile ? mobileDrawerWidth : desktopDrawerWidth;

  // Loading Screen Component
  const LoadingScreen = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
      }}
    >
      <Box
        sx={{
          mt: 8,
          padding: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "pulse 1.5s ease-in-out infinite",
          "@keyframes pulse": {
            "0%": { transform: "scale(1)", opacity: 1 },
            "50%": { transform: "scale(1.1)", opacity: 0.8 },
            "100%": { transform: "scale(1)", opacity: 1 },
          },
        }}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt="Logo"
            style={{
              width: "140px",
              height: "140px",
              objectFit: "contain",
              display: "block",
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <Typography
            sx={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#FF9800",
            }}
          >
            B
          </Typography>
        )}
      </Box>
      <Typography
        variant="h5"
        sx={{
          color: "primary.main",
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        BALAJI BANKING
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          fontWeight: 500,
        }}
      >
        Loading your data...
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />
      <Header
        onMenuClick={handleDrawerToggle}
        drawerWidth={drawerWidth}
        collapsed={sidebarCollapsed}
      />
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
          backgroundColor: "background.default",
          width: { xs: "100%", md: `calc(100% - ${desktopDrawerWidth}px)` },
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1 }}>
          {loading ? <LoadingScreen /> : <Outlet />}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;