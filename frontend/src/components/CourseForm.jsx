import { useState } from "react";

import { Grid, MenuItem, TextField } from "@mui/material";

import api from "../services/api";
import { useApi } from "../services/useApi";
import FormDialog from "./FormDialog";

const TEACHER_PARAMS = { page: 1, page_size: 100 };

function CourseForm({ editingCourse, loadCourses, closeForm }) {
  const teachers = useApi("/teachers", TEACHER_PARAMS).data?.data ?? [];

  const [course, setCourse] = useState({
    name: editingCourse?.name ?? "",
    code: editingCourse?.code ?? "",
    credit_hours: editingCourse?.credit_hours ?? "",
    description: editingCourse?.description ?? "",
    teacher_id: editingCourse?.teacher_id ?? "",
  });

  const handleChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (editingCourse) {
      await api.put(`/courses/${editingCourse.id}`, course);
    } else {
      await api.post("/courses", course);
    }

    loadCourses();
  };

  return (
    <FormDialog
      title={editingCourse ? "Edit Course" : "Add Course"}
      submitLabel={editingCourse ? "Update" : "Save"}
      onSubmit={handleSubmit}
      onClose={closeForm}
    >
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Course Name"
            fullWidth
            required
            name="name"
            value={course.name}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Course Code"
            fullWidth
            required
            name="code"
            value={course.code}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Credit Hours"
            fullWidth
            required
            type="number"
            name="credit_hours"
            value={course.credit_hours}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            name="description"
            value={course.description}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            select
            label="Teacher"
            fullWidth
            name="teacher_id"
            value={teachers.length > 0 ? course.teacher_id : ""}
            onChange={handleChange}
          >
            <MenuItem value="">Not Assigned</MenuItem>

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

export default CourseForm;
