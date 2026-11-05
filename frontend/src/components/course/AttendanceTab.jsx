import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import api, { getApiError } from "../../services/api";
import { formatDate, formatPercent, todayIso } from "../../services/format";
import { useApi } from "../../services/useApi";

const STATUS_COLORS = { present: "success", late: "warning", absent: "error" };

function MyAttendance({ courseId }) {
  const { data, error } = useApi(`/courses/${courseId}/attendance/me`);

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Attendance: {formatPercent(data?.percent)}
      </Typography>

      {data?.records.length === 0 && (
        <Typography color="text.secondary">No attendance has been recorded yet.</Typography>
      )}

      <Stack spacing={1}>
        {data?.records.map((record) => (
          <Paper
            key={record.date}
            variant="outlined"
            sx={{ p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography variant="body2">{formatDate(`${record.date}T00:00:00`)}</Typography>
            <Chip size="small" color={STATUS_COLORS[record.status]} label={record.status} />
          </Paper>
        ))}
      </Stack>
    </>
  );
}

function MarkAttendance({ courseId, day }) {
  const params = useMemo(() => ({ on: day }), [day]);
  const { data: roster, error, reload } = useApi(`/courses/${courseId}/attendance`, params);

  const [changes, setChanges] = useState({});
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const statusOf = (row) => changes[row.student_id] ?? row.status;

  const markAllPresent = () => {
    setChanges(Object.fromEntries(roster.map((row) => [row.student_id, "present"])));
  };

  const handleSave = async () => {
    setMessage("");
    setSaveError("");

    const records = roster
      .filter((row) => statusOf(row))
      .map((row) => ({ student_id: row.student_id, status: statusOf(row) }));

    try {
      await api.post(`/courses/${courseId}/attendance`, { date: day, records });
      setChanges({});
      setMessage("Attendance saved.");
      reload();
    } catch (err) {
      setSaveError(getApiError(err));
    }
  };

  if (roster?.length === 0) {
    return <Typography color="text.secondary">No students are enrolled yet.</Typography>;
  }

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Stack spacing={1}>
        {roster?.map((row) => (
          <Paper
            key={row.student_id}
            variant="outlined"
            sx={{
              p: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.student_name}</Typography>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={statusOf(row)}
              onChange={(_, status) => {
                if (status) setChanges({ ...changes, [row.student_id]: status });
              }}
            >
              <ToggleButton value="present" color="success">Present</ToggleButton>
              <ToggleButton value="late" color="warning">Late</ToggleButton>
              <ToggleButton value="absent" color="error">Absent</ToggleButton>
            </ToggleButtonGroup>
          </Paper>
        ))}
      </Stack>

      <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={handleSave}>Save attendance</Button>
        <Button onClick={markAllPresent}>Mark all present</Button>
      </Box>
    </>
  );
}

function AttendanceTab({ courseId, canManage }) {
  const [day, setDay] = useState(todayIso());

  if (!canManage) {
    return <MyAttendance courseId={courseId} />;
  }

  return (
    <>
      <TextField
        label="Date"
        type="date"
        size="small"
        sx={{ mb: 2 }}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayIso() } }}
        value={day}
        onChange={(e) => setDay(e.target.value)}
      />

      {/* Keyed by date so unsaved marks never carry over to another day */}
      {day && <MarkAttendance key={day} courseId={courseId} day={day} />}
    </>
  );
}

export default AttendanceTab;
