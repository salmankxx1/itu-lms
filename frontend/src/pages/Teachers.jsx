import { useState } from "react";

import api from "../services/api";
import { useServerTable } from "../services/useApi";
import DeleteDialog from "../components/DeleteDialog";
import LoginResultDialog from "../components/LoginResultDialog";
import PageHeader from "../components/PageHeader";
import TeacherTable from "../components/TeacherTable";
import TeacherForm from "../components/TeacherForm";

import { Button, Snackbar, Alert, TextField } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

function Teachers() {
  const table = useServerTable("/teachers");

  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [snackbar, setSnackbar] = useState(false);
  const [created, setCreated] = useState(null);

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setShowForm(true);
  };

  return (
    <>
      <PageHeader
        title="Teachers"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Teacher
          </Button>
        }
      />

      <TextField
        fullWidth
        label="Search Teacher"
        sx={{ mb: 2 }}
        value={table.search}
        onChange={(e) => table.changeSearch(e.target.value)}
      />

      <TeacherTable table={table} onEdit={handleEdit} onDelete={setTeacherToDelete} />

      <DeleteDialog
        open={teacherToDelete !== null}
        title="Delete Teacher"
        message={`Delete "${teacherToDelete?.name}"? Their login is removed, and their courses and students become unassigned.`}
        onCancel={() => setTeacherToDelete(null)}
        onConfirm={async () => {
          await api.delete(`/teachers/${teacherToDelete.id}`);
          table.reload();
          setTeacherToDelete(null);
        }}
      />

      {showForm && (
        <TeacherForm
          editingTeacher={editingTeacher}
          loadTeachers={(newPerson) => {
            table.reload();
            if (newPerson) {
              setCreated(newPerson);
            } else {
              setSnackbar(true);
            }
          }}
          closeForm={() => setShowForm(false)}
        />
      )}

      <LoginResultDialog person={created} onClose={() => setCreated(null)} />

      <Snackbar open={snackbar} autoHideDuration={3000} onClose={() => setSnackbar(false)}>
        <Alert severity="success">Saved</Alert>
      </Snackbar>
    </>
  );
}

export default Teachers;
