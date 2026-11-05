import { Alert, Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";

import { AnnouncementList } from "../components/AnnouncementFeed";
import CourseCards from "../components/CourseCards";
import { MetricCard, UpcomingList, WelcomeBanner } from "../components/PortalSections";
import { useApi } from "../services/useApi";

export default function TeacherPortal() {
  const { data, error, loading } = useApi("/me/overview");

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <WelcomeBanner
        overline="ITU Faculty Portal • Burki Road Campus"
        name={data.name}
        detail={data.detail}
        gradient="linear-gradient(135deg, #0f766e 0%, #065f46 100%)"
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 4 }}>
          <MetricCard label="Assigned Courses" value={data.courses.length} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <MetricCard label="Students Taught" value={data.students_total} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard label="Waiting to Grade" value={data.pending_grading} color="warning.main" />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1.5 }}>My Courses</Typography>
      <Box sx={{ mb: 3 }}>
        <CourseCards courses={data.courses} emptyText="No courses are assigned to you yet." />
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Upcoming Deadlines</Typography>
            <UpcomingList items={data.upcoming} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Latest Announcements</Typography>
            <AnnouncementList announcements={data.announcements} />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
