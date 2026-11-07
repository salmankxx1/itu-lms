import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";

import Navbar from "./Navbar";
import CustomCursor from "./CustomCursor";
import LocalCopyBanner from "./LocalCopyBanner";

function Layout({ mode, setMode }) {
  return (
    <Box
      className={mode === "dark" ? "galaxy-viewport" : ""}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: mode === "light" ? "#f8fafc" : "#070913",
        color: mode === "light" ? "#0f172a" : "#f8fafc",
        transition: "background-color 0.3s ease",
      }}
    >
      <CustomCursor />
      <LocalCopyBanner />
      <Navbar mode={mode} setMode={setMode} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          py: { xs: 2.5, sm: 3.5, md: 4 },
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
