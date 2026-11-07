import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Chip,
  Tooltip,
  Container,
} from "@mui/material";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearSession } from "../services/api";

function Navbar({ mode, setMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    localStorage.setItem("theme", newMode);
    setMode(newMode);
  };

  const userRole = (localStorage.getItem("role") || "admin").toLowerCase();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const getNavLinks = () => {
    if (userRole === "student") {
      return [
        { label: "Learning Space", path: "/", icon: <DashboardOutlinedIcon fontSize="small" /> },
        { label: "My Courses", path: "/courses", icon: <MenuBookOutlinedIcon fontSize="small" /> },
        { label: "Browse Courses", path: "/catalog", icon: <LibraryAddOutlinedIcon fontSize="small" /> },
        { label: "My Grades", path: "/grades", icon: <GradeOutlinedIcon fontSize="small" /> },
        { label: "Announcements", path: "/announcements", icon: <CampaignOutlinedIcon fontSize="small" /> },
      ];
    }
    if (userRole === "teacher") {
      return [
        { label: "Faculty Hub", path: "/", icon: <ClassOutlinedIcon fontSize="small" /> },
        { label: "My Students", path: "/students", icon: <GroupOutlinedIcon fontSize="small" /> },
        { label: "My Courses", path: "/courses", icon: <MenuBookOutlinedIcon fontSize="small" /> },
        { label: "Announcements", path: "/announcements", icon: <CampaignOutlinedIcon fontSize="small" /> },
      ];
    }
    // Admin
    return [
      { label: "LMS Analytics", path: "/", icon: <DashboardOutlinedIcon fontSize="small" /> },
      { label: "Students", path: "/students", icon: <SchoolOutlinedIcon fontSize="small" /> },
      { label: "Faculty", path: "/teachers", icon: <PersonOutlinedIcon fontSize="small" /> },
      { label: "Courses", path: "/courses", icon: <MenuBookOutlinedIcon fontSize="small" /> },
      { label: "Requests", path: "/requests", icon: <HowToRegOutlinedIcon fontSize="small" /> },
      { label: "Announcements", path: "/announcements", icon: <CampaignOutlinedIcon fontSize="small" /> },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: mode === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(7, 9, 19, 0.85)",
        backdropFilter: "blur(16px) saturate(180%)",
        borderBottom: "1px solid",
        borderColor: mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)",
        color: "text.primary",
        zIndex: 1100,
        width: "100%",
        top: 0,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 70 }, display: "flex", justifyContent: "space-between", gap: 2 }}>
          {/* Brand Logo & Title */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "inherit",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #0f766e 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.4)",
              }}
            >
              <AutoStoriesOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                  ITU LMS
                </Typography>
                <Chip
                  label={userRole.toUpperCase()}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "10px",
                    fontWeight: 700,
                    bgcolor: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11px" }}>
                Burki Road Campus
              </Typography>
            </Box>
          </Box>

          {/* Top Header Navigation Items (Replacing Sidebar) */}
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              gap: 1,
              bgcolor: mode === "light" ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
              p: 0.6,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {navLinks.map((item) => {
              const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
              return (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    textTransform: "none",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: "8px",
                    px: 2,
                    py: 0.8,
                    color: isActive ? "#38bdf8" : "text.secondary",
                    bgcolor: isActive
                      ? mode === "light"
                        ? "rgba(2, 132, 199, 0.12)"
                        : "rgba(56, 189, 248, 0.15)"
                      : "transparent",
                    border: isActive ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
                    boxShadow: isActive ? "0 0 12px rgba(56, 189, 248, 0.2)" : "none",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      color: "#38bdf8",
                      bgcolor: "rgba(56, 189, 248, 0.1)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Action Links & Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Button
              component={Link}
              to="/home"
              target="_blank"
              size="small"
              startIcon={<OpenInNewIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "13px",
                color: "text.secondary",
                borderRadius: "8px",
                display: { xs: "none", md: "inline-flex" },
                "&:hover": { color: "#38bdf8", bgcolor: "rgba(56, 189, 248, 0.08)" },
              }}
            >
              Public Site
            </Button>

            <Tooltip title={mode === "light" ? "Switch to Galaxy Dark" : "Switch to Light Mode"}>
              <IconButton
                onClick={toggleTheme}
                aria-label="Switch color theme"
                size="small"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "10px",
                  p: 0.8,
                }}
              >
                {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Change Password">
              <IconButton
                component={Link}
                to="/change-password"
                aria-label="Change password"
                size="small"
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: "10px", p: 0.8 }}
              >
                <LockResetOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Logout Action */}
            <Tooltip title="Sign Out">
              <IconButton
                onClick={handleLogout}
                aria-label="Sign out"
                size="small"
                sx={{
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  bgcolor: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  borderRadius: "10px",
                  p: 0.8,
                  "&:hover": {
                    bgcolor: "rgba(239, 68, 68, 0.18)",
                  },
                }}
              >
                <LogoutOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Mobile Horizontal Bar */}
        <Box
          sx={{
            display: { xs: "flex", lg: "none" },
            overflowX: "auto",
            py: 1,
            gap: 1,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {navLinks.map((item) => {
            const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            return (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                size="small"
                startIcon={item.icon}
                sx={{
                  textTransform: "none",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  borderRadius: "8px",
                  color: isActive ? "#38bdf8" : "text.secondary",
                  bgcolor: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </Container>
    </AppBar>
  );
}

export default Navbar;
