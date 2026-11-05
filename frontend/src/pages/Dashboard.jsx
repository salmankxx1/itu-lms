import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";

import CoursesTeacherChart from "../components/dashboard/CoursesTeacherChart";
import GenderPieChart from "../components/dashboard/GenderPieChart";
import StudentsMonthChart from "../components/dashboard/StudentsMonthChart";
import StudentsTeacherChart from "../components/dashboard/StudentsTeacherChart";
import { MetricCard } from "../components/PortalSections";
import { useApi } from "../services/useApi";

const ThreeDChartWidget = lazy(() => import("../components/dashboard/ThreeDChartWidget"));

function ChartCard({ title, caption, children }) {
  return (
    <Card className="galaxy-glass-card" sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        {caption}
      </Typography>
      {children}
    </Card>
  );
}

function Dashboard() {
  const { data: dashboard, error, loading } = useApi("/dashboard");

  if (loading && !dashboard) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboard) {
    return <Alert severity="error">{error}</Alert>;
  }

  const missingLogins = dashboard.studentsWithoutLogin + dashboard.teachersWithoutLogin;

  const threeDChartData = [
    { label: "Students", value: dashboard.students, color: "#0284c7" },
    { label: "Faculty", value: dashboard.teachers, color: "#10b981" },
    { label: "Courses", value: dashboard.courses, color: "#a855f7" },
    { label: "Enrollments", value: dashboard.enrollments, color: "#f59e0b" },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 4 },
          borderRadius: "20px",
          backgroundImage:
            "linear-gradient(135deg, rgba(7, 9, 19, 0.88) 0%, rgba(15, 23, 42, 0.78) 55%, rgba(12, 74, 110, 0.6) 100%), url('/images/campus-wide.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ maxWidth: 680 }}>
          <Typography variant="h3" sx={{ fontWeight: 900 }}>
            Information Technology University
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)", mt: 1 }}>
            Live overview of students, faculty and courses at the Burki Road campus.
          </Typography>
        </Box>

        <Button
          component={Link}
          to="/students"
          variant="contained"
          startIcon={<AddCircleOutlineOutlinedIcon />}
        >
          Add Student
        </Button>
      </Box>

      {missingLogins > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {dashboard.studentsWithoutLogin} students and {dashboard.teachersWithoutLogin} teachers
          have no login yet. Open <Link to="/students">Students</Link> or{" "}
          <Link to="/teachers">Teachers</Link> and click their "No login" badge to create one.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Students" value={dashboard.students} color="#0284c7" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Faculty" value={dashboard.teachers} color="#10b981" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Courses" value={dashboard.courses} color="#a855f7" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Enrollments" value={dashboard.enrollments} color="#f59e0b" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard title="Campus at a Glance" caption="Live totals in 3D. Drag to rotate.">
            <Suspense fallback={<CircularProgress />}>
              <ThreeDChartWidget data={threeDChartData} />
            </Suspense>
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard title="Students by Gender" caption="Current student records">
            <GenderPieChart data={dashboard.gender} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Enrollment Over Time" caption="Students added per month">
            <StudentsMonthChart data={dashboard.studentsPerMonth} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Students per Advisor" caption="Advisees assigned to each teacher">
            <StudentsTeacherChart data={dashboard.studentsPerTeacher} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Courses per Teacher" caption="Current teaching load">
            <CoursesTeacherChart data={dashboard.coursesPerTeacher} />
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Recently Added Students</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboard.recentStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
