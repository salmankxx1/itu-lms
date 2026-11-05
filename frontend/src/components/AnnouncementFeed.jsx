import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";

import api, { getApiError } from "../services/api";
import { formatDateTime } from "../services/format";

export function AnnouncementList({ announcements, onChanged }) {
  const [error, setError] = useState("");

  if (announcements.length === 0) {
    return <Typography color="text.secondary">No announcements yet.</Typography>;
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      onChanged?.();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <Stack spacing={1.5}>
      {error && <Alert severity="error">{error}</Alert>}

      {announcements.map((announcement) => (
        <Paper key={announcement.id} variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {announcement.title}
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={announcement.course_code || "Campus-wide"}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {announcement.author_name || "Administration"} • {formatDateTime(announcement.created_at)}
              </Typography>
            </Box>

            {announcement.can_delete && onChanged && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  aria-label="Delete announcement"
                  onClick={() => handleDelete(announcement.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {announcement.body}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

export function AnnouncementComposer({ courseId, onPosted }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/announcements", { title, body, course_id: courseId ?? null });
      setTitle("");
      setBody("");
      onPosted();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 2, mb: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="Title"
        fullWidth
        required
        size="small"
        sx={{ mb: 1.5 }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        label="Message"
        fullWidth
        required
        multiline
        minRows={2}
        sx={{ mb: 1.5 }}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" variant="contained">
        Post announcement
      </Button>
    </Paper>
  );
}
