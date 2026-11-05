import { useState } from "react";

import api from "../services/api";
import { useServerTable } from "../services/useApi";
import DeleteDialog from "../components/DeleteDialog";
import LoginResultDialog from "../components/LoginResultDialog";
import PageHeader from "../components/PageHeader";
import StudentTable from "../components/StudentTable";
import StudentForm from "../components/StudentForm";

import { Button, Snackbar, Alert, TextField } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

function Students() {
  const canManage = localStorage.getItem("role") === "admin";

  const table = useServerTable("/students");

  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [snackbar, setSnackbar] = useState(false);
  const [created, setCreated] = useState(null);

  const handleEdit = (student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  return (
    <>
      <PageHeader
        title={canManage ? "Students" : "My Students"}
        subtitle={canManage ? undefined : "Your advisees and the students in your courses"}
        action={
          canManage && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Add Student
            </Button>
          )
        }
      />

      <TextField
        label="Search Student"
        fullWidth
        sx={{ mb: 2 }}
        value={table.search}
        onChange={(e) => table.changeSearch(e.target.value)}
      />

      <StudentTable
        table={table}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={setStudentToDelete}
      />

      <DeleteDialog
        open={studentToDelete !== null}
        title="Delete Student"
        message={`Delete "${studentToDelete?.name}"? Their login and coursework will also be removed.`}
        onCancel={() => setStudentToDelete(null)}
        onConfirm={async () => {
          await api.delete(`/students/${studentToDelete.id}`);
          table.reload();
          setStudentToDelete(null);
        }}
      />

      {showForm && (
        <StudentForm
          editingStudent={editingStudent}
          loadStudents={(newPerson) => {
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

export default Students;
