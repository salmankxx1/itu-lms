import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

import api, { getApiError } from "../services/api";

const STATUS = {
  none: { label: "No login", color: "error" },
  pending: { label: "Awaiting first login", color: "warning" },
  active: { label: "Active", color: "success" },
};

// Shows the true account state, and lets an admin create or reset the login
function AccountCell({ person, resetPath, canManage, onDone }) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(null);
  const [error, setError] = useState("");

  const status = STATUS[person.account_status] ?? STATUS.none;
  const hasLogin = person.account_status !== "none";

  const handleConfirm = async () => {
    try {
      const response = await api.post(resetPath);
      setLogin(response.data);
      onDone?.();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const handleClose = () => {
    setOpen(false);
    setLogin(null);
    setError("");
  };

  const chip = <Chip size="small" label={status.label} color={status.color} variant="outlined" />;

  if (!canManage) {
    return chip;
  }

  return (
    <>
      <Button
        size="small"
        onClick={() => setOpen(true)}
        title={hasLogin ? "Reset login" : "Create login"}
        sx={{ p: 0, minWidth: 0 }}
      >
        {chip}
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{hasLogin && !login ? "Reset login" : "Login details"}</DialogTitle>

        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {login ? (
            <>
              <Alert severity={login.email_sent ? "success" : "error"} sx={{ mb: 2 }}>
                {login.email_sent
                  ? `Gmail accepted the email to ${login.email}. Ask them to check spam if it is not in their inbox.`
                  : `The email to ${login.email} could not be sent. Give them this password yourself.`}
              </Alert>
              <DialogContentText sx={{ mb: 2 }}>
                This temporary password is shown only once.
              </DialogContentText>
              <Typography sx={{ fontFamily: "monospace", fontSize: 18, wordBreak: "break-all" }}>
                {login.temporary_password}
              </Typography>
            </>
          ) : (
            <DialogContentText>
              {hasLogin
                ? `${person.name}'s current password will stop working. A new temporary password will be emailed to ${person.email}.`
                : `A login will be created for ${person.name} and a temporary password emailed to ${person.email}.`}
            </DialogContentText>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>{login ? "Done" : "Cancel"}</Button>
          {!login && (
            <Button variant="contained" onClick={handleConfirm}>
              {hasLogin ? "Reset" : "Create login"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AccountCell;
