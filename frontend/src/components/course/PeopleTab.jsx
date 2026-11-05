import { useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api, { getApiError } from "../../services/api";
import { useApi } from "../../services/useApi";

const STUDENT_PARAMS = { page: 1, page_size: 100, sort_by: "name" };

function EnrollForm({ courseId, enrolledIds, onEnrolled }) {
  const { data } = useApi("/students", STUDENT_PARAMS);

  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");

  const options = useMemo(
    () => (data?.data ?? []).filter((s) => !enrolledIds.includes(s.id)),
    [data, enrolledIds]
  );

  const handleEnroll = async () => {
    setError("");

    try {
      await api.post(`/courses/${courseId}/enrollments`, { student_id: student.id });
      setStudent(null);
      onEnrolled();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Autocomplete
          sx={{ flexGrow: 1, minWidth: 220 }}
          size="small"
          options={options}
          value={student}
          onChange={(_, value) => setStudent(value)}
          getOptionLabel={(option) => `${option.name} (${option.email})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} label="Add a student" />}
        />
        <Button variant="contained" disabled={!student} onClick={handleEnroll}>
          Enroll
        </Button>
      </Box>
    </>
  );
}

function PeopleTab({ courseId }) {
  const isAdmin = localStorage.getItem("role") === "admin";

  const { data: students, error, reload } = useApi(`/courses/${courseId}/enrollments`);

  const [removeError, setRemoveError] = useState("");

  const enrolledIds = useMemo(() => (students ?? []).map((s) => s.id), [students]);

  const handleRemove = async (studentId) => {
    setRemoveError("");

    try {
      await api.delete(`/courses/${courseId}/enrollments/${studentId}`);
      reload();
    } catch (err) {
      setRemoveError(getApiError(err));
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {removeError && <Alert severity="error" sx={{ mb: 2 }}>{removeError}</Alert>}

      {isAdmin && <EnrollForm courseId={courseId} enrolledIds={enrolledIds} onEnrolled={reload} />}

      {students?.length === 0 && (
        <Typography color="text.secondary">No students are enrolled yet.</Typography>
      )}

      <Stack spacing={1}>
        {students?.map((student) => (
          <Paper
            key={student.id}
            variant="outlined"
            sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{student.name}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {student.email}
              </Typography>
            </Box>

            {isAdmin && (
              <Button size="small" color="error" onClick={() => handleRemove(student.id)}>
                Remove
              </Button>
            )}
          </Paper>
        ))}
      </Stack>
    </>
  );
}

export default PeopleTab;
