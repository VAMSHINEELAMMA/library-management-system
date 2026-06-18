import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Button, Box, Card,
  CardContent, AppBar, Toolbar, TextField, Alert,
  Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";

interface LoginHistory {
  loginTime: string;
  logoutTime: string;
}

interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  fineBalance: number;
  createdAt: string;
  lastLogin: string;
  lastLogout: string;
  loginHistory: LoginHistory[];
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(
        "https://library-management-system-ih9d.onrender.com/api/members",
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      setMembers(res.data);
    } catch (err) {
      setError("Failed to fetch members");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await axios.delete(
        "https://library-management-system-ih9d.onrender.com/api/members/" + id,
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      setMessage("Member deleted");
      fetchMembers();
    } catch (err) {
      setError("Failed to delete");
    }
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Manage Members</Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="h5" gutterBottom>
          All Members ({filtered.length})
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 3 }}>
          {filtered.map((member) => (
            <Card key={member._id}>
              <CardContent>
                <Typography variant="h6">{member.name}</Typography>
                <Typography color="textSecondary">{member.email}</Typography>
                <Typography variant="body2">Phone: {member.phone || "N/A"}</Typography>
                <Typography variant="body2">Address: {member.address || "N/A"}</Typography>
                <Typography variant="body2">
                  Account Created: {new Date(member.createdAt).toLocaleDateString()}
                </Typography>
                {member.lastLogin && (
                  <Typography variant="body2" color="success.main">
                    Last Login: {new Date(member.lastLogin).toLocaleString()}
                  </Typography>
                )}
                {member.lastLogout && (
                  <Typography variant="body2" color="error">
                    Last Logout: {new Date(member.lastLogout).toLocaleString()}
                  </Typography>
                )}
                {member.fineBalance > 0 && (
                  <Typography variant="body2" color="error">
                    Fine Balance: Rs. {member.fineBalance}
                  </Typography>
                )}

                {member.loginHistory && member.loginHistory.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary>
                      <Typography variant="body2">
                        Login History ({member.loginHistory.length} sessions)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {member.loginHistory.slice(-5).reverse().map((h, i) => (
                        <Box key={i} sx={{ mb: 1, p: 1, bgcolor: "grey.100", borderRadius: 1 }}>
                          <Typography variant="body2" color="success.main">
                            Login: {new Date(h.loginTime).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="error">
                            Logout: {h.logoutTime ? new Date(h.logoutTime).toLocaleString() : "Still logged in"}
                          </Typography>
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" color="error" size="small"
                    onClick={() => handleDelete(member._id)}>
                    Delete Member
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
};

export default Members;

