import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useServerTable } from "../services/useApi";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import CourseTable from "../components/CourseTable";
import CourseForm from "../components/CourseForm";

import { Button, Snackbar, Alert, TextField } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

function Courses() {
  const navigate = useNavigate();

  const table = useServerTable("/courses");

  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [snackbar, setSnackbar] = useState(false);

  const handleEdit = (course) => {
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setShowForm(true);
  };

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Open a course to manage its students, content and grades"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Course
          </Button>
        }
      />

      <TextField
        fullWidth
        label="Search Course"
        sx={{ mb: 2 }}
        value={table.search}
        onChange={(e) => table.changeSearch(e.target.value)}
      />

      <CourseTable
        table={table}
        onOpen={(course) => navigate(`/courses/${course.id}`)}
        onEdit={handleEdit}
        onDelete={setCourseToDelete}
      />

      <DeleteDialog
        open={courseToDelete !== null}
        title="Delete Course"
        message={`Delete "${courseToDelete?.name}"? Its enrollments, assignments, grades and attendance will also be removed.`}
        onCancel={() => setCourseToDelete(null)}
        onConfirm={async () => {
          await api.delete(`/courses/${courseToDelete.id}`);
          table.reload();
          setCourseToDelete(null);
        }}
      />

      {showForm && (
        <CourseForm
          editingCourse={editingCourse}
          loadCourses={() => {
            table.reload();
            setSnackbar(true);
          }}
          closeForm={() => setShowForm(false)}
        />
      )}

      <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <Alert severity="success">Saved</Alert>
      </Snackbar>
    </>
  );
}

export default Courses;
