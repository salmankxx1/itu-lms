import { useState } from "react";

import { Grid, MenuItem, TextField } from "@mui/material";

import api from "../services/api";
import FormDialog from "./FormDialog";

const DEPARTMENTS = [
  ["CS", "Computer Science"],
  ["SE", "Software Engineering"],
  ["AI", "Artificial Intelligence"],
  ["DS", "Data Science"],
  ["EE", "Electrical Engineering"],
];

function TeacherForm({ editingTeacher, loadTeachers, closeForm }) {
  const [teacher, setTeacher] = useState({
    name: editingTeacher?.name ?? "",
    email: editingTeacher?.email ?? "",
    subject: editingTeacher?.subject ?? "",
    department: editingTeacher?.department ?? "",
  });

  const handleChange = (e) => {
    setTeacher({ ...teacher, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (editingTeacher) {
      await api.put(`/teachers/${editingTeacher.id}`, teacher);
    } else {
      const response = await api.post("/teachers", teacher);
      loadTeachers(response.data);
      return;
    }

    loadTeachers();
  };

  return (
    <FormDialog
      title={editingTeacher ? "Edit Teacher" : "Add Teacher"}
      submitLabel={editingTeacher ? "Update" : "Save"}
      onSubmit={handleSubmit}
      onClose={closeForm}
    >
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Name"
            name="name"
            fullWidth
            required
            value={teacher.name}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Email"
            name="email"
            type="email"
            helperText="Login credentials and a unique password are sent to this email"
            fullWidth
            required
            value={teacher.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Subject"
            name="subject"
            fullWidth
            required
            value={teacher.subject}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            label="Department"
            name="department"
            fullWidth
            required
            value={teacher.department}
            onChange={handleChange}
          >
            {DEPARTMENTS.map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </FormDialog>
  );
}

export default TeacherForm;
