import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { getMonthsForYear } from "../utils/dateUtils";

const DrawerContent = ({ onItemClick, collapsed, isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentYear } = useAppContext();

  const menuItems = [
    { title: "Dashboard Overview", path: "/", icon: <DashboardIcon /> },
    ...getMonthsForYear(currentYear).map(({ name, index }) => ({
      title: name,
      path: `/month/${index}`,
      icon: <CalendarMonthIcon />,
    })),
  ];

  return (
    <>
      <Toolbar
        sx={{
          py: 2,
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 0 : 2,
          transition: "all 0.3s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              backgroundColor: "#FFE0B2",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                display: "block",
              }}
            />
          </Box>
          {!collapsed && (
            <>
              {/* Mobile View: Stacked text */}
              {isMobile ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: 0.5,
                      color: "#fff",
                      textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      fontSize: " 1.1rem",
                      lineHeight: 1.2,
                    }}
                  >
                    BALAJI
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      color: "#FF9800",
                      fontSize: " 1rem",
                      lineHeight: 1.2,
                    }}
                  >
                    BANKING
                  </Typography>
                </Box>
              ) : (
                /* Desktop View: Single line text */
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  BALAJI BANKING
                </Typography>
              )}
            </>
          )}
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.05)", mb: 2 }} />

      <Box
        sx={{ overflowX: "hidden", overflowY: "auto", px: collapsed ? 1 : 1.5 }}
      >
        <List>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    navigate(item.path);
                    onItemClick?.();
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    px: collapsed ? 0 : 2,
                    justifyContent: collapsed ? "center" : "flex-start",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      backgroundColor: "secondary.main",
                      transform: isSelected ? "scaleY(1)" : "scaleY(0)",
                      transition: "transform 0.2s ease",
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                    },
                    "&.Mui-selected": {
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      transform: collapsed ? "none" : "translateX(4px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isSelected
                        ? "secondary.main"
                        : "rgba(255,255,255,0.5)",
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#fff" : "rgba(255,255,255,0.7)",
                        transition: "color 0.2s ease",
                        whiteSpace: "nowrap",
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

const Sidebar = ({ mobileOpen, onClose, collapsed, drawerWidth = 280 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Use smaller width for mobile drawer
  const mobileDrawerWidth = 220; // Adjust as needed
  const finalDrawerWidth = isMobile ? mobileDrawerWidth : drawerWidth;

  return (
    <Box
      component="nav"
      sx={{
        width: { md: finalDrawerWidth },
        flexShrink: { md: 0 },
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      {/* Mobile: Temporary Drawer (hamburger-triggered) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .MuiDrawer-paper`]: {
            width: mobileDrawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#0F172A",
          },
        }}
      >
        <DrawerContent
          onItemClick={onClose}
          collapsed={false}
          isMobile={true}
        />
      </Drawer>

      {/* Desktop: Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          [`& .MuiDrawer-paper`]: {
            width: finalDrawerWidth,
            boxSizing: "border-box",
            borderRight: "none",
            overflowX: "hidden",
            backgroundColor: "#0F172A",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
        open
      >
        <DrawerContent collapsed={collapsed} isMobile={false} />
      </Drawer>
    </Box>
  );
};

export default Sidebar;
