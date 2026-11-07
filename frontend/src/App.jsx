import { lazy, Suspense, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "@mui/material/styles";
import { Box, CircularProgress, CssBaseline } from "@mui/material";

import Login from "./pages/Login";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { getTheme } from "./theme";

// Loaded on demand so the login page does not download the 3D and chart code
const PublicHome = lazy(() => import("./pages/PublicHome"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const RoleDispatcher = lazy(() => import("./pages/RoleDispatcher"));
const Students = lazy(() => import("./pages/Students"));
const Teachers = lazy(() => import("./pages/Teachers"));
const CoursesRouter = lazy(() => import("./pages/CoursesRouter"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Grades = lazy(() => import("./pages/Grades"));
const CourseCatalog = lazy(() => import("./pages/CourseCatalog"));
const EnrollmentRequests = lazy(() => import("./pages/EnrollmentRequests"));

const pageLoader = (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
    <CircularProgress />
  </Box>
);

function App() {
  const [mode, setMode] = useState(
    localStorage.getItem("theme") || "light"
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <BrowserRouter>
        <Suspense fallback={pageLoader}>
          <Routes>
            {/* Public-Facing Experience without login */}
            <Route path="/home" element={<PublicHome />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            {/* Protected Role-Based University Portal */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout mode={mode} setMode={setMode} />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RoleDispatcher />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/courses" element={<CoursesRouter />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route
                path="/students"
                element={
                  <ProtectedRoute roles={["admin", "teacher"]}>
                    <Students />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <Teachers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/catalog"
                element={
                  <ProtectedRoute roles={["student"]}>
                    <CourseCatalog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <EnrollmentRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grades"
                element={
                  <ProtectedRoute roles={["student"]}>
                    <Grades />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
