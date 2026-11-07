import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

import PageHeader from "../components/PageHeader";
import api, { getApiError } from "../services/api";
import { useApi } from "../services/useApi";

const STATUS = {
  enrolled: { label: "Enrolled", color: "success" },
  pending: { label: "Waiting for approval", color: "warning" },
  rejected: { label: "Not approved", color: "error" },
};

function CourseActions({ course, onAction, busy }) {
  if (course.status === "enrolled") {
    return (
      <Button component={Link} to={`/courses/${course.id}`} size="small">
        Open course
      </Button>
    );
  }

  if (course.status === "pending") {
    return (
      <Button size="small" color="inherit" disabled={busy} onClick={() => onAction("cancel", course)}>
        Cancel request
      </Button>
    );
  }

  return (
    <Button size="small" variant="contained" disabled={busy} onClick={() => onAction("request", course)}>
      {course.status === "rejected" ? "Request again" : "Request to join"}
    </Button>
  );
}

function CourseCatalog() {
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ search: search || undefined }), [search]);
  const { data: courses, error, loading, reload } = useApi("/course-catalog", params);

  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const handleAction = async (action, course) => {
    setActionError("");
    setBusyId(course.id);

    try {
      if (action === "request") {
        await api.post("/enrollment-requests", { course_id: course.id });
      } else {
        await api.delete(`/enrollment-requests/${course.request_id}`);
      }
      reload();
    } catch (err) {
      setActionError(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = courses?.filter((course) => course.status === "pending").length ?? 0;

  return (
    <>
      <PageHeader
        title="Browse Courses"
        subtitle="Request the courses you want to take. The administration approves each request."
      />

      {pendingCount > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {pendingCount} {pendingCount === 1 ? "request is" : "requests are"} waiting for approval.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      <TextField
        label="Search by course name or code"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && !courses ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : courses?.length === 0 ? (
        <Typography color="text.secondary">No courses match your search.</Typography>
      ) : (
        <Grid container spacing={2}>
          {courses?.map((course) => {
            const status = STATUS[course.status];

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={course.id}>
                <Card className="galaxy-glass-card" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1, flexWrap: "wrap" }}>
                      <Chip size="small" color="primary" label={course.code} />
                      {status && <Chip size="small" color={status.color} variant="outlined" label={status.label} />}
                    </Box>

                    <Typography variant="h6">{course.name}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      {course.teacher_name || "Teacher to be announced"} • {course.credit_hours} credit hours •{" "}
                      {course.enrolled_count} enrolled
                    </Typography>

                    {course.description && (
                      <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
                        {course.description}
                      </Typography>
                    )}

                    {course.status === "rejected" && course.note && (
                      <Alert severity="error" sx={{ mt: 1.5 }}>
                        Reason: {course.note}
                      </Alert>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <CourseActions course={course} onAction={handleAction} busy={busyId === course.id} />
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}

export default CourseCatalog;
