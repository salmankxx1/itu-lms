import { Link } from "react-router-dom";
import { Box, Card, CardActionArea, CardContent, Chip, Grid, Typography } from "@mui/material";

import { formatPercent } from "../services/format";

function CourseCards({ courses, emptyText }) {
  if (courses.length === 0) {
    return <Typography color="text.secondary">{emptyText}</Typography>;
  }

  return (
    <Grid container spacing={2}>
      {courses.map((course) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={course.id}>
          <Card className="galaxy-glass-card" sx={{ height: "100%" }}>
            <CardActionArea component={Link} to={`/courses/${course.id}`} sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                  <Chip size="small" color="primary" label={course.code} />
                  {course.letter && <Chip size="small" variant="outlined" label={`Grade ${course.letter}`} />}
                  {course.pending_grading > 0 && (
                    <Chip size="small" color="warning" label={`${course.pending_grading} to grade`} />
                  )}
                </Box>

                <Typography variant="h6">{course.name}</Typography>

                <Typography variant="body2" color="text.secondary">
                  {course.teacher_name || "No teacher assigned"} • {course.credit_hours} credit hours
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {course.pending_grading === undefined || course.pending_grading === null
                    ? `Attendance: ${formatPercent(course.attendance_percent)}`
                    : `${course.enrolled_count} students enrolled`}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default CourseCards;
