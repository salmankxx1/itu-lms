import { useState } from "react";
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api, { getApiError } from "../services/api";

function ChangePassword() {

    const navigate = useNavigate();

    const mustChange = localStorage.getItem("first_login") === "true";

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleChangePassword = async (e) => {

        e.preventDefault();

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {

            await api.post(
                "/change-password",
                {
                    current_password: currentPassword,
                    new_password: newPassword
                }
            );

            localStorage.setItem("first_login", "false");

            navigate("/");

        }

        catch (err) {
            setError(getApiError(err, "Unable to change password."));
        }

    };

    return (

        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>

            <Paper
                component="form"
                onSubmit={handleChangePassword}
                sx={{ width: "100%", maxWidth: 450, p: { xs: 3, sm: 4 } }}
            >

                <Typography variant="h4" sx={{ mb: 1 }}>
                    Change Password
                </Typography>

                {mustChange && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        For your security, choose your own password before continuing.
                    </Typography>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                    fullWidth
                    required
                    type="password"
                    label="Current Password"
                    sx={{ mb: 2 }}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <TextField
                    fullWidth
                    required
                    type="password"
                    label="New Password"
                    helperText="At least 8 characters"
                    sx={{ mb: 2 }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                <TextField
                    fullWidth
                    required
                    type="password"
                    label="Confirm Password"
                    sx={{ mb: 3 }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button fullWidth type="submit" variant="contained">
                    Change Password
                </Button>

                {!mustChange && (
                    <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate("/")}>
                        Cancel
                    </Button>
                )}

            </Paper>

        </Box>

    );

}

export default ChangePassword;
