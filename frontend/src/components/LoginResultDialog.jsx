import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

// Tells the admin what really happened to a new person's login email
function LoginResultDialog({ person, onClose }) {
  if (!person) {
    return null;
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>{person.name} was added</DialogTitle>

      <DialogContent>
        {person.email_sent ? (
          <Alert severity="success">
            Gmail accepted the login email to {person.email}. Ask them to check their spam folder if
            it is not in their inbox.
          </Alert>
        ) : (
          <>
            <Alert severity="error" sx={{ mb: 2 }}>
              The login email to {person.email} could not be sent.
            </Alert>
            <DialogContentText sx={{ mb: 2 }}>
              Give them this temporary password yourself. It is shown only once.
            </DialogContentText>
            <Typography sx={{ fontFamily: "monospace", fontSize: 18, wordBreak: "break-all" }}>
              {person.temporary_password}
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

export default LoginResultDialog;
