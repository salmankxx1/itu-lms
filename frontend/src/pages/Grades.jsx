import {
  Alert,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

import PageHeader from "../components/PageHeader";
import { downloadCsv, formatPercent } from "../services/format";
import { useApi } from "../services/useApi";

function Grades() {
  const { data, error } = useApi("/me/grades");

  const courses = data?.courses ?? [];

  const handleDownload = () => {
    downloadCsv("grade-report.csv", [
      ["Code", "Course", "Credit Hours", "Percent", "Grade"],
      ...courses.map((c) => [c.code, c.name, c.credit_hours, c.percent, c.letter]),
      [],
      ["GPA", data?.gpa ?? ""],
    ]);
  };

  return (
    <>
      <PageHeader
        title="My Grades"
        subtitle={data?.gpa != null ? `Current GPA: ${data.gpa.toFixed(2)}` : "No graded work yet"}
        action={
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={courses.length === 0}
            onClick={handleDownload}
          >
            Download Report
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: { xs: 1, sm: 2 } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell align="right">Credits</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.course_id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{course.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{course.code}</Typography>
                  </TableCell>
                  <TableCell align="right">{course.credit_hours}</TableCell>
                  <TableCell align="right">{formatPercent(course.percent)}</TableCell>
                  <TableCell align="right">{course.letter || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {data && courses.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            You are not enrolled in any courses yet.
          </Typography>
        )}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        Scores are based on graded work so far, so they can change during the semester.
      </Typography>
    </>
  );
}

export default Grades;
