import { Alert, Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";

import { AnnouncementList } from "../components/AnnouncementFeed";
import CourseCards from "../components/CourseCards";
import { MetricCard, UpcomingList, WelcomeBanner } from "../components/PortalSections";
import { formatPercent } from "../services/format";
import { useApi } from "../services/useApi";

export default function StudentPortal() {
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

  const dueSoon = data.upcoming.filter((item) => !item.submitted).length;
  const credits = data.courses.reduce((sum, course) => sum + course.credit_hours, 0);

  return (
    <>
      <WelcomeBanner
        overline="ITU Student Portal • Burki Road Campus"
        name={data.name}
        detail={data.detail}
        gradient="linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Current GPA" value={data.gpa?.toFixed(2) ?? "—"} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard
            label="Attendance"
            value={formatPercent(data.attendance_percent)}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Courses" value={data.courses.length} note={`${credits} credit hours`} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <MetricCard label="Due soon" value={dueSoon} color="warning.main" note="Not yet submitted" />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1.5 }}>My Courses</Typography>
      <Box sx={{ mb: 3 }}>
        <CourseCards
          courses={data.courses}
          emptyText="You are not enrolled in any courses yet. The administration will enroll you."
        />
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Upcoming Deadlines</Typography>
            <UpcomingList items={data.upcoming} showSubmitted />
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
