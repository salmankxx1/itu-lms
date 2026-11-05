import { useState } from "react";
import { Paper, TextField, Button, Typography, Box, Alert } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api, { getApiError } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSigningIn(true);
    try {
      const res = await api.post("/login", {
        email,
        password,
      });

      // Save credentials & permissions
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("first_login", res.data.first_login);

      if (res.data.first_login) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } catch (err) {
      setErrorMsg(getApiError(err, "Unable to sign in."));
      setSigningIn(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0b0f19",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
        backgroundImage: "radial-gradient(circle at 50% 30%, rgba(2, 132, 199, 0.15) 0%, transparent 70%)",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleLogin}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: "20px",
          bgcolor: "rgba(30, 41, 59, 0.75)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          color: "#fff",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0284c7, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
              fontSize: "1.3rem",
              color: "#fff",
              mx: "auto",
              mb: 1.5,
              boxShadow: "0 0 15px rgba(2, 132, 199, 0.6)",
            }}
          >
            ITU
          </Box>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Portal Access
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Information Technology University • Burki Campus
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
            {errorMsg}
          </Alert>
        )}

        <TextField
          fullWidth
          label="University Email"
          type="email"
          required
          autoComplete="username"
          variant="outlined"
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              bgcolor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "10px",
            },
            "& .MuiInputLabel-root": { color: "#94a3b8" },
          }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          variant="outlined"
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              bgcolor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "10px",
            },
            "& .MuiInputLabel-root": { color: "#94a3b8" },
          }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={signingIn}
          sx={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            textTransform: "none",
            fontWeight: "bold",
            py: 1.3,
            borderRadius: "10px",
            fontSize: "1rem",
            mb: 2,
            "&:hover": {
              background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
            },
          }}
        >
          {signingIn ? "Signing in..." : "Sign In"}
        </Button>

        {signingIn && (
          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textAlign: "center", mb: 2 }}>
            The first sign-in after a quiet period can take up to a minute.
          </Typography>
        )}

        <Button
          component={Link}
          to="/home"
          fullWidth
          startIcon={<ArrowBackIcon />}
          sx={{
            color: "#94a3b8",
            textTransform: "none",
            "&:hover": { color: "#fff" },
          }}
        >
          Return to Public Burki Campus Site
        </Button>
      </Paper>
    </Box>
  );
}

export default Login;
