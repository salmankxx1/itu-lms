import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import api, { getApiError } from "../../services/api";
import { formatDateTime } from "../../services/format";
import { useApi } from "../../services/useApi";

function SubmissionRow({ submission, maxPoints, onSaved }) {
  const [score, setScore] = useState(submission.score ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    try {
      await api.put(`/submissions/${submission.id}/grade`, { score, feedback });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700 }}>{submission.student_name}</Typography>
        {submission.is_late && <Chip size="small" color="warning" label="Late" />}
      </Box>

      <Typography variant="caption" color="text.secondary">
        {formatDateTime(submission.submitted_at)}
      </Typography>

      <Typography variant="body2" sx={{ my: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
        {submission.content}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label={`Score / ${maxPoints}`}
          type="number"
          size="small"
          required
          sx={{ width: 120 }}
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <TextField
          label="Feedback"
          size="small"
          sx={{ flexGrow: 1, minWidth: 160 }}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <Button type="submit" variant="contained" size="small">
          {saved ? "Saved" : "Save grade"}
        </Button>
      </Box>
    </Paper>
  );
}

function SubmissionsDialog({ assignment, onChanged, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: submissions, error } = useApi(`/assignments/${assignment.id}/submissions`);

  return (
    <Dialog open maxWidth="md" fullWidth fullScreen={fullScreen} onClose={onClose}>
      <DialogTitle>{assignment.title}</DialogTitle>

      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}

        {submissions?.length === 0 && (
          <Typography color="text.secondary">Nothing has been submitted yet.</Typography>
        )}

        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {submissions?.map((submission) => (
            <SubmissionRow
              key={submission.id}
              submission={submission}
              maxPoints={assignment.max_points}
              onSaved={onChanged}
            />
          ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SubmissionsDialog;
