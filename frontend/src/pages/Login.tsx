import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, TextField, Button, Box,
  Typography, Alert, Paper
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "https://library-management-system-ih9d.onrender.com/api/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.msg || "Login failed");
    }
    setLoading(false);
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #8D6E63 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Container maxWidth="sm">
        <Paper elevation={8} sx={{ p: 5, borderRadius: 3 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <MenuBookIcon sx={{ fontSize: 60, color: "primary.main", mb: 1 }} />
            <Typography variant="h4" color="primary.dark" gutterBottom>
              Library Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Please sign in.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: "1rem" }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <Typography align="center">
            Don not have an account?{" "}
            <Typography component="span" onClick={() => navigate("/register")}
              sx={{ color: "secondary.main", cursor: "pointer", fontWeight: "bold" }}>
              Register here
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

