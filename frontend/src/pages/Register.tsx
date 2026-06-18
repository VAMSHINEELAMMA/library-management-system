import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, TextField, Button, Box, Typography,
  Alert, Paper, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "member"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");
    if (!formData.name || !formData.email || !formData.password) {
      setError("Name, email and password are required");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        "https://library-management-system-ih9d.onrender.com/api/auth/register",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.msg || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography variant="h4" align="center" gutterBottom>
            Library Management
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
            Create your account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField fullWidth label="Full Name" name="name"
            value={formData.name} onChange={handleChange} margin="normal" required />

          <TextField fullWidth label="Email" name="email" type="email"
            value={formData.email} onChange={handleChange} margin="normal" required />

          <TextField fullWidth label="Password" name="password" type="password"
            value={formData.password} onChange={handleChange} margin="normal" required />

          <TextField fullWidth label="Phone" name="phone"
            value={formData.phone} onChange={handleChange} margin="normal" />

          <TextField fullWidth label="Address" name="address"
            value={formData.address} onChange={handleChange} margin="normal" multiline rows={2} />

          <FormControl fullWidth margin="normal">
            <InputLabel>Register As</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Register As"
              onChange={handleChange}
            >
              <MenuItem value="member">Member (Borrow Books)</MenuItem>
              <MenuItem value="librarian">Librarian (Manage Library)</MenuItem>
            </Select>
          </FormControl>

          <Button fullWidth variant="contained" size="large"
            sx={{ mt: 3, mb: 2 }} onClick={handleRegister} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </Button>

          <Typography align="center">
            Already have an account?{" "}
            <Typography component="span" onClick={() => navigate("/login")}
              sx={{ color: "primary.main", cursor: "pointer", fontWeight: "bold" }}>
              Login
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;

