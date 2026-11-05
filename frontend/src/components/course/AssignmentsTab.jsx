import { useState } from "react";
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";

import api from "../../services/api";
import { formatDateTime } from "../../services/format";
import { useApi } from "../../services/useApi";
import DeleteDialog from "../DeleteDialog";
import FormDialog from "../FormDialog";
import SubmissionsDialog from "./SubmissionsDialog";

// A datetime-local input expects local time without a zone
function toLocalInput(value) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function AssignmentForm({ courseId, assignment, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    due_date: assignment ? toLocalInput(assignment.due_date) : "",
    max_points: assignment?.max_points ?? 100,
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    const payload = { ...form, due_date: new Date(form.due_date).toISOString() };

    if (assignment) {
      await api.put(`/assignments/${assignment.id}`, payload);
    } else {
      await api.post(`/courses/${courseId}/assignments`, payload);
    }

    onSaved();
  };

  return (
    <FormDialog
      title={assignment ? "Edit Assignment" : "New Assignment"}
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Title"
          name="title"
          fullWidth
          required
          value={form.title}
          onChange={handleChange}
        />
        <TextField
          label="Instructions"
          name="description"
          fullWidth
          multiline
          minRows={3}
          value={form.description}
          onChange={handleChange}
        />
        <TextField
          label="Due date"
          name="due_date"
          type="datetime-local"
          fullWidth
          required
          slotProps={{ inputLabel: { shrink: true } }}
          value={form.due_date}
          onChange={handleChange}
        />
        <TextField
          label="Max points"
          name="max_points"
          type="number"
          fullWidth
          required
          value={form.max_points}
          onChange={handleChange}
        />
      </Stack>
    </FormDialog>
  );
}

function SubmitForm({ assignment, onSaved, onClose }) {
  const [content, setContent] = useState(assignment.my_submission?.content ?? "");

  const handleSubmit = async () => {
    await api.put(`/assignments/${assignment.id}/submission`, { content });
    onSaved();
  };

  return (
    <FormDialog
      title={`Submit: ${assignment.title}`}
      submitLabel="Submit"
      onSubmit={handleSubmit}
      onClose={onClose}
    >
      <TextField
        label="Your answer or a link to your work"
        fullWidth
        required
        multiline
        minRows={5}
        sx={{ mt: 1 }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </FormDialog>
  );
}

function StudentStatus({ assignment }) {
  const submission = assignment.my_submission;

  if (!submission) {
    return new Date(assignment.due_date) < new Date() ? (
      <Chip size="small" color="error" label="Missing" />
    ) : (
      <Chip size="small" label="Not submitted" />
    );
  }

  if (submission.score !== null) {
    return (
      <Chip
        size="small"
        color="success"
        label={`Graded: ${submission.score}/${assignment.max_points}`}
      />
    );
  }

  return (
    <Chip
      size="small"
      color={submission.is_late ? "warning" : "primary"}
      label={submission.is_late ? "Submitted late" : "Submitted"}
    />
  );
}

function AssignmentsTab({ courseId, canManage }) {
  const { data: assignments, error, reload } = useApi(`/courses/${courseId}/assignments`);

  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {canManage && (
        <Button variant="contained" sx={{ mb: 2 }} onClick={() => setEditing({})}>
          New assignment
        </Button>
      )}

      {assignments?.length === 0 && (
        <Typography color="text.secondary">No assignments yet.</Typography>
      )}

      <Stack spacing={1.5}>
        {assignments?.map((assignment) => (
          <Paper key={assignment.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{assignment.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Due {formatDateTime(assignment.due_date)} • {assignment.max_points} points
                </Typography>
              </Box>

              {canManage ? (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${assignment.graded_count}/${assignment.submission_count} graded`}
                />
              ) : (
                <StudentStatus assignment={assignment} />
              )}
            </Box>

            {assignment.description && (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {assignment.description}
              </Typography>
            )}

            {assignment.my_submission?.feedback && (
              <Alert severity="info" sx={{ mt: 1 }}>{assignment.my_submission.feedback}</Alert>
            )}

            <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
              {canManage ? (
                <>
                  <Button size="small" variant="outlined" onClick={() => setReviewing(assignment)}>
                    Review submissions
                  </Button>
                  <Button size="small" onClick={() => setEditing(assignment)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => setDeleting(assignment)}>
                    Delete
                  </Button>
                </>
              ) : (
                assignment.my_submission?.score == null && (
                  <Button size="small" variant="outlined" onClick={() => setSubmitting(assignment)}>
                    {assignment.my_submission ? "Update submission" : "Submit"}
                  </Button>
                )
              )}
            </Box>
          </Paper>
        ))}
      </Stack>

      {editing && (
        <AssignmentForm
          courseId={courseId}
          assignment={editing.id ? editing : null}
          onSaved={reload}
          onClose={() => setEditing(null)}
        />
      )}

      {submitting && (
        <SubmitForm assignment={submitting} onSaved={reload} onClose={() => setSubmitting(null)} />
      )}

      {reviewing && (
        <SubmissionsDialog
          assignment={reviewing}
          onChanged={reload}
          onClose={() => setReviewing(null)}
        />
      )}

      <DeleteDialog
        open={deleting !== null}
        title="Delete Assignment"
        message={`Delete "${deleting?.title}"? All submissions and grades for it will be removed.`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          await api.delete(`/assignments/${deleting.id}`);
          reload();
          setDeleting(null);
        }}
      />
    </>
  );
}

export default AssignmentsTab;
