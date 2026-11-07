import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import FormDialog from "../components/FormDialog";
import PageHeader from "../components/PageHeader";
import api, { getApiError } from "../services/api";
import { formatDateTime } from "../services/format";
import { useApi } from "../services/useApi";

function RejectDialog({ request, onDone, onClose }) {
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    await api.post(`/enrollment-requests/${request.id}/reject`, { note });
    onDone();
  };

  return (
    <FormDialog title="Reject request" submitLabel="Reject" onSubmit={handleSubmit} onClose={onClose}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {request.student_name} asked to join {request.course_code} {request.course_name}.
      </Typography>
      <TextField
        label="Reason (optional, shown to the student)"
        fullWidth
        multiline
        minRows={2}
        slotProps={{ htmlInput: { maxLength: 500 } }}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </FormDialog>
  );
}

function EnrollmentRequests() {
  const [status, setStatus] = useState("pending");
  const params = useMemo(() => ({ status }), [status]);
  const { data: requests, error, reload } = useApi("/enrollment-requests", params);

  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const handleApprove = async (request) => {
    setActionError("");
    setBusyId(request.id);

    try {
      await api.post(`/enrollment-requests/${request.id}/approve`);
      reload();
    } catch (err) {
      setActionError(getApiError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Course Requests" subtitle="Students waiting to join a course" />

      <Paper sx={{ mb: 2 }}>
        <Tabs value={status} onChange={(_, value) => setStatus(value)} variant="fullWidth">
          <Tab value="pending" label="Waiting" />
          <Tab value="approved" label="Approved" />
          <Tab value="rejected" label="Rejected" />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {requests?.length === 0 && (
        <Typography color="text.secondary">
          {status === "pending" ? "No requests are waiting." : `No ${status} requests yet.`}
        </Typography>
      )}

      <Stack spacing={1.5}>
        {requests?.map((request) => (
          <Paper
            key={request.id}
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{request.student_name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {request.student_email}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Chip size="small" color="primary" label={request.course_code} />
                <Typography variant="body2">
                  {request.course_name} • {request.credit_hours} credit hours
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {status === "pending"
                  ? `Requested ${formatDateTime(request.created_at)}`
                  : `Decided ${formatDateTime(request.decided_at)}`}
              </Typography>
              {request.note && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Reason: {request.note}
                </Typography>
              )}
            </Box>

            {status === "pending" && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  disabled={busyId === request.id}
                  onClick={() => handleApprove(request)}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={busyId === request.id}
                  onClick={() => setRejecting(request)}
                >
                  Reject
                </Button>
              </Box>
            )}
          </Paper>
        ))}
      </Stack>

      {rejecting && (
        <RejectDialog request={rejecting} onDone={reload} onClose={() => setRejecting(null)} />
      )}
    </>
  );
}

export default EnrollmentRequests;
