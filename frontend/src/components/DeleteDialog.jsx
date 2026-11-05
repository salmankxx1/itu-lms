import { useState } from "react";
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

import { getApiError } from "../services/api";

function DeleteDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}) {
  const [error, setError] = useState("");

  const handleCancel = () => {
    setError("");
    onCancel();
  };

  const handleConfirm = async () => {
    try {
      setError("");
      await onConfirm();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={handleConfirm}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteDialog;
