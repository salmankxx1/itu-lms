import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";

import api, { getApiError } from "../../services/api";
import { useApi } from "../../services/useApi";

const EMPTY = { title: "", url: "", description: "" };

function MaterialsTab({ courseId, canManage }) {
  const { data: materials, error, reload } = useApi(`/courses/${courseId}/materials`);

  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      await api.post(`/courses/${courseId}/materials`, form);
      setForm(EMPTY);
      reload();
    } catch (err) {
      setFormError(getApiError(err));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/materials/${id}`);
      reload();
    } catch (err) {
      setFormError(getApiError(err));
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

      {canManage && (
        <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                label="Title"
                name="title"
                size="small"
                fullWidth
                required
                value={form.title}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                label="Link (slides, video, drive file)"
                name="url"
                type="url"
                size="small"
                fullWidth
                required
                value={form.url}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description (optional)"
                name="description"
                size="small"
                fullWidth
                value={form.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 1.5 }}>
            Add material
          </Button>
        </Paper>
      )}

      {materials?.length === 0 && (
        <Typography color="text.secondary">No materials have been shared yet.</Typography>
      )}

      <Stack spacing={1.5}>
        {materials?.map((material) => (
          <Paper key={material.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Link href={material.url} target="_blank" rel="noopener noreferrer" fontWeight={700}>
                  {material.title}
                </Link>
                {material.description && (
                  <Typography variant="body2" color="text.secondary">
                    {material.description}
                  </Typography>
                )}
              </Box>

              {canManage && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    aria-label="Delete material"
                    onClick={() => handleDelete(material.id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Paper>
        ))}
      </Stack>
    </>
  );
}

export default MaterialsTab;
