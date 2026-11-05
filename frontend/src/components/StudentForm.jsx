import { useState } from "react";

import { Grid, MenuItem, TextField } from "@mui/material";

import api from "../services/api";
import { useApi } from "../services/useApi";
import FormDialog from "./FormDialog";

const TEACHER_PARAMS = { page: 1, page_size: 100 };

function StudentForm({ loadStudents, closeForm, editingStudent }) {
  const teachers = useApi("/teachers", TEACHER_PARAMS).data?.data ?? [];

  const [student, setStudent] = useState({
    name: editingStudent?.name ?? "",
    email: editingStudent?.email ?? "",
    age: editingStudent?.age ?? "",
    gender: editingStudent?.gender ?? "",
    teacher_id: editingStudent?.teacher_id ?? "",
  });

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (editingStudent) {
      await api.put(`/students/${editingStudent.id}`, student);
    } else {
      const response = await api.post("/students", student);
      loadStudents(response.data);
      return;
    }

    loadStudents();
  };

  return (
    <FormDialog
      title={editingStudent ? "Edit Student" : "Add Student"}
      submitLabel={editingStudent ? "Update" : "Save"}
      onSubmit={handleSubmit}
      onClose={closeForm}
    >
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Name"
            fullWidth
            required
            name="name"
            value={student.name}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Personal Email Address"
            helperText="Login credentials and a unique password are sent to this email"
            fullWidth
            required
            type="email"
            name="email"
            value={student.email}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Age"
            fullWidth
            required
            type="number"
            name="age"
            value={student.age}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            label="Gender"
            fullWidth
            required
            name="gender"
            value={student.gender}
            onChange={handleChange}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            select
            fullWidth
            label="Faculty Advisor"
            name="teacher_id"
            value={teachers.length > 0 ? student.teacher_id : ""}
            onChange={handleChange}
          >
            <MenuItem value="">None</MenuItem>

            {teachers.map((teacher) => (
              <MenuItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </FormDialog>
  );
}

export default StudentForm;
