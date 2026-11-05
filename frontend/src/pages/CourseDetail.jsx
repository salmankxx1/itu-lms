import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import AnnouncementsTab from "../components/course/AnnouncementsTab";
import AssignmentsTab from "../components/course/AssignmentsTab";
import AttendanceTab from "../components/course/AttendanceTab";
import GradebookTab from "../components/course/GradebookTab";
import MaterialsTab from "../components/course/MaterialsTab";
import PeopleTab from "../components/course/PeopleTab";
import { useApi } from "../services/useApi";

function CourseDetail() {
  const { courseId } = useParams();
  const { data: course, error, loading } = useApi(`/courses/${courseId}`);

  const [tab, setTab] = useState("announcements");

  if (loading && !course) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return <Alert severity="error">{error || "Course not found."}</Alert>;
  }

  const isMember = course.can_manage || course.is_enrolled;
  const props = { courseId: course.id, canManage: course.can_manage };

  return (
    <>
      <Button component={Link} to="/courses" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        All courses
      </Button>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 2, borderRadius: 4 }}>
        <Typography variant="overline" color="primary">
          {course.code} • {course.credit_hours} credit hours
        </Typography>
        <Typography variant="h4">{course.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {course.teacher?.name || "No teacher assigned"} • {course.enrolled_count} enrolled
        </Typography>
        {course.description && (
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {course.description}
          </Typography>
        )}
      </Paper>

      {!isMember ? (
        <Alert severity="info">You are not part of this course.</Alert>
      ) : (
        <>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab value="announcements" label="Announcements" />
              <Tab value="materials" label="Materials" />
              <Tab value="assignments" label="Assignments" />
              <Tab value="attendance" label="Attendance" />
              {course.can_manage && <Tab value="people" label="People" />}
              {course.can_manage && <Tab value="gradebook" label="Gradebook" />}
            </Tabs>
          </Paper>

          {tab === "announcements" && <AnnouncementsTab {...props} />}
          {tab === "materials" && <MaterialsTab {...props} />}
          {tab === "assignments" && <AssignmentsTab {...props} />}
          {tab === "attendance" && <AttendanceTab {...props} />}
          {tab === "people" && <PeopleTab {...props} />}
          {tab === "gradebook" && <GradebookTab {...props} course={course} />}
        </>
      )}
    </>
  );
}

export default CourseDetail;
