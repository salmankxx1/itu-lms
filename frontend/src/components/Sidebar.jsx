import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

import { Link, useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 260;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = (localStorage.getItem("role") || "admin").toLowerCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("first_login");
    navigate("/");
  };

  const navItemStyles = (isActive) => ({
    borderRadius: "10px",
    mx: 1.5,
    my: 0.4,
    px: 1.8,
    py: 1,
    transition: "all 0.2s ease-in-out",
    bgcolor: isActive ? "rgba(2, 132, 199, 0.10)" : "transparent",
    color: isActive ? "#0284c7" : "text.primary",
    fontWeight: isActive ? 600 : 500,
    "&:hover": {
      bgcolor: isActive ? "rgba(2, 132, 199, 0.16)" : "action.hover",
      transform: "translateX(3px)",
    },
    "& .MuiListItemIcon-root": {
      color: isActive ? "#0284c7" : "text.secondary",
      minWidth: "38px",
    },
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        },
      }}
    >
      <Box>
        {/* LMS Brand Header */}
        <Toolbar sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0284c7 0%, #0f766e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 10px rgba(2, 132, 199, 0.25)",
            }}
          >
            <AutoStoriesOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
             
              sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.3px" }}
              noWrap
            >
              ITU LMS
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "#10b981",
                  display: "inline-block",
                }}
              />
              Burki Portal
            </Typography>
          </Box>
        </Toolbar>

        <Divider sx={{ opacity: 0.6 }} />

        {/* User Mini Profile Card */}
        <Box
          sx={{
            m: 1.5,
            p: 1.5,
            borderRadius: "12px",
            bgcolor: (theme) =>
              theme.palette.mode === "light" ? "rgba(241, 245, 249, 0.8)" : "rgba(255, 255, 255, 0.03)",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor:
                userRole === "admin"
                  ? "#0284c7"
                  : userRole === "teacher"
                  ? "#0f766e"
                  : "#8b5cf6",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {userRole.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: "hidden", flexGrow: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {userRole === "admin"
                ? "System Admin"
                : userRole === "teacher"
                ? "Instructor"
                : "Student User"}
            </Typography>
            <Chip
              label={userRole.toUpperCase()}
              size="small"
              sx={{
                height: 18,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                bgcolor:
                  userRole === "admin"
                    ? "rgba(2, 132, 199, 0.15)"
                    : userRole === "teacher"
                    ? "rgba(15, 118, 110, 0.15)"
                    : "rgba(139, 92, 246, 0.15)",
                color:
                  userRole === "admin"
                    ? "#0284c7"
                    : userRole === "teacher"
                    ? "#0f766e"
                    : "#8b5cf6",
              }}
            />
          </Box>
        </Box>

        {/* Navigation Sections */}
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              fontSize: "11px",
            }}
          >
            LMS Workspace
          </Typography>
        </Box>

        <List disablePadding>
          {/* Student Routes */}
          {userRole === "student" && (
            <>
              <ListItemButton
                component={Link}
                to="/"
                sx={navItemStyles(location.pathname === "/")}
              >
                <ListItemIcon>
                  <DashboardOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Learning Space"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/courses"
                sx={navItemStyles(location.pathname === "/courses")}
              >
                <ListItemIcon>
                  <MenuBookOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Enrolled Courses"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>
            </>
          )}

          {/* Teacher Routes */}
          {userRole === "teacher" && (
            <>
              <ListItemButton
                component={Link}
                to="/"
                sx={navItemStyles(location.pathname === "/")}
              >
                <ListItemIcon>
                  <ClassOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Teaching Hub"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/students"
                sx={navItemStyles(location.pathname === "/students")}
              >
                <ListItemIcon>
                  <GroupOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="My Students"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/courses"
                sx={navItemStyles(location.pathname === "/courses")}
              >
                <ListItemIcon>
                  <MenuBookOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Assigned Courses"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>
            </>
          )}

          {/* Admin Routes */}
          {userRole === "admin" && (
            <>
              <ListItemButton
                component={Link}
                to="/"
                sx={navItemStyles(location.pathname === "/")}
              >
                <ListItemIcon>
                  <DashboardOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="LMS Analytics"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/students"
                sx={navItemStyles(location.pathname === "/students")}
              >
                <ListItemIcon>
                  <SchoolOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Student Directory"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/teachers"
                sx={navItemStyles(location.pathname === "/teachers")}
              >
                <ListItemIcon>
                  <PersonOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Faculty Roster"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>

              <ListItemButton
                component={Link}
                to="/courses"
                sx={navItemStyles(location.pathname === "/courses")}
              >
                <ListItemIcon>
                  <MenuBookOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Curriculum & Courses"
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
              </ListItemButton>
            </>
          )}
        </List>

        <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              fontSize: "11px",
            }}
          >
            Explore & Connect
          </Typography>
        </Box>

        <List disablePadding>
          <ListItemButton
            component={Link}
            to="/home"
            sx={navItemStyles(location.pathname === "/home")}
          >
            <ListItemIcon>
              <PublicOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary="ITU Burki Campus"
              primaryTypographyProps={{ fontSize: "14px" }}
            />
          </ListItemButton>
        </List>
      </Box>

      {/* Sidebar Footer & Logout */}
      <Box sx={{ p: 1.5 }}>
        <Divider sx={{ mb: 1.5, opacity: 0.6 }} />
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "10px",
            px: 1.8,
            py: 1,
            color: "error.main",
            "&:hover": {
              bgcolor: "rgba(239, 68, 68, 0.08)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: "38px", color: "error.main" }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Sign Out"
            primaryTypographyProps={{ fontSize: "14px", fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
