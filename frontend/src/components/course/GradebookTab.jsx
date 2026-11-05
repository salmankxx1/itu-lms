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

import { downloadCsv, formatPercent } from "../../services/format";
import { useApi } from "../../services/useApi";

function GradebookTab({ courseId, course }) {
  const { data, error } = useApi(`/courses/${courseId}/gradebook`);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return null;
  }

  if (data.rows.length === 0) {
    return <Typography color="text.secondary">No students are enrolled yet.</Typography>;
  }

  const handleExport = () => {
    downloadCsv(`${course.code}-gradebook.csv`, [
      ["Student", ...data.assignments.map((a) => `${a.title} (/${a.max_points})`), "Percent", "Grade", "Attendance"],
      ...data.rows.map((row) => [
        row.student_name,
        ...row.cells.map((cell) => cell.score),
        row.percent,
        row.letter,
        row.attendance_percent,
      ]),
    ]);
  };

  return (
    <>
      <Button startIcon={<DownloadIcon />} variant="outlined" sx={{ mb: 2 }} onClick={handleExport}>
        Export CSV
      </Button>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                {data.assignments.map((assignment) => (
                  <TableCell key={assignment.id} align="right" sx={{ whiteSpace: "nowrap" }}>
                    {assignment.title} (/{assignment.max_points})
                  </TableCell>
                ))}
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Grade</TableCell>
                <TableCell align="right">Attendance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.student_id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{row.student_name}</TableCell>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.assignment_id} align="right">
                      {cell.score ?? "—"}
                    </TableCell>
                  ))}
                  <TableCell align="right">{formatPercent(row.percent)}</TableCell>
                  <TableCell align="right">{row.letter || "—"}</TableCell>
                  <TableCell align="right">{formatPercent(row.attendance_percent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}

export default GradebookTab;
