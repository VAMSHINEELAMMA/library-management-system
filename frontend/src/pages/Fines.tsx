import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Button, Box, Card, CardContent,
  AppBar, Toolbar, Chip, Alert, Select,
  MenuItem, FormControl, InputLabel
} from "@mui/material";

interface Fine {
  _id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  memberId?: { name: string; email: string };
}

interface Member {
  _id: string;
  name: string;
  email: string;
}

const FINE_OPTIONS = [
  { amount: 10, reason: "Overdue return - 1 day" },
  { amount: 25, reason: "Overdue return - 3 days" },
  { amount: 50, reason: "Overdue return - 1 week" },
  { amount: 100, reason: "Overdue return - 2 weeks" },
  { amount: 200, reason: "Book damaged" },
  { amount: 500, reason: "Book lost" },
  { amount: 50, reason: "Late fee" }
];

const Fines: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedFineOption, setSelectedFineOption] = useState<number | "">("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const isLibrarian = user.role === "librarian" || user.role === "admin";

  useEffect(() => {
    if (!user.id) { navigate("/login"); return; }
    console.log("User role:", user.role);
    console.log("Token:", token ? "exists" : "missing");
    if (isLibrarian) {
      fetchAllFines();
      fetchMembers();
    } else {
      fetchMyFines();
    }
  }, []);

  const fetchMyFines = async () => {
    try {
      const res = await axios.get(
        "https://library-management-system-ih9d.onrender.com/api/fines/my/" + user.id,
        { headers: { Authorization: "Bearer " + token } }
      );
      setFines(res.data);
    } catch (err) {
      console.log("Error fetching my fines");
    }
  };

  const fetchAllFines = async () => {
    try {
      const res = await axios.get(
        "https://library-management-system-ih9d.onrender.com/api/fines/all",
        { headers: { Authorization: "Bearer " + token } }
      );
      setFines(res.data);
    } catch (err) {
      console.log("Error fetching all fines");
    }
  };

  const fetchMembers = async () => {
    try {
      console.log("Fetching members...");
      const res = await axios.get(
        "https://library-management-system-ih9d.onrender.com/api/members",
        { headers: { Authorization: "Bearer " + token } }
      );
      console.log("Members loaded:", res.data.length);
      setMembers(res.data);
    } catch (err: any) {
      console.log("Error fetching members:", err.message);
      setError("Failed to load members: " + err.message);
    }
  };

  const handlePayFine = async (fineId: string) => {
    try {
      const res = await axios.put(
        "https://library-management-system-ih9d.onrender.com/api/fines/pay/" + fineId,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage(res.data.msg);
      setError("");
      isLibrarian ? fetchAllFines() : fetchMyFines();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Payment failed");
    }
  };

  const handleAddFine = async () => {
    if (!selectedMember || selectedFineOption === "") {
      setError("Please select both member and fine type");
      return;
    }
    const option = FINE_OPTIONS[selectedFineOption as number];
    try {
      await axios.post(
        "https://library-management-system-ih9d.onrender.com/api/fines",
        {
          memberId: selectedMember,
          amount: option.amount,
          reason: option.reason
        },
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("Fine of Rs. " + option.amount + " added successfully!");
      setError("");
      setSelectedMember("");
      setSelectedFineOption("");
      fetchAllFines();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to add fine");
    }
  };

  const totalPending = fines
    .filter(f => f.status === "pending")
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {isLibrarian ? "Manage Fines" : "My Fines"}
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {isLibrarian && (
          <Box sx={{ mb: 4, p: 3, border: "1px solid #ddd", borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add Fine to Member
            </Typography>

            {members.length === 0 ? (
              <Alert severity="warning">
                No members found. Make sure members are registered!
              </Alert>
            ) : (
              <Box sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 2,
                alignItems: "center"
              }}>
                <FormControl fullWidth>
                  <InputLabel>Select Member</InputLabel>
                  <Select
                    value={selectedMember}
                    label="Select Member"
                    onChange={(e) => setSelectedMember(e.target.value)}
                  >
                    {members.map((m) => (
                      <MenuItem key={m._id} value={m._id}>
                        {m.name} ({m.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Fine Type & Amount</InputLabel>
                  <Select
                    value={selectedFineOption}
                    label="Fine Type & Amount"
                    onChange={(e) => setSelectedFineOption(e.target.value as number)}
                  >
                    {FINE_OPTIONS.map((opt, i) => (
                      <MenuItem key={i} value={i}>
                        Rs. {opt.amount} - {opt.reason}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="error"
                  onClick={handleAddFine}
                  sx={{ py: 1.8, px: 3 }}
                >
                  Add Fine
                </Button>
              </Box>
            )}
          </Box>
        )}

        {totalPending > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Total Pending Fines: <strong>Rs. {totalPending}</strong>
          </Alert>
        )}

        <Typography variant="h5" gutterBottom>
          {isLibrarian ? "All Fines" : "My Fines"} ({fines.length})
        </Typography>

        {fines.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No fines found!
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 3
          }}>
            {fines.map((fine) => (
              <Card key={fine._id} sx={{
                border: fine.status === "pending"
                  ? "2px solid orange"
                  : "2px solid green"
              }}>
                <CardContent>
                  {isLibrarian && fine.memberId && (
                    <Typography variant="body1"
                      sx={{ fontWeight: "bold", mb: 1 }}>
                      Member: {fine.memberId.name} ({fine.memberId.email})
                    </Typography>
                  )}
                  <Typography variant="h5"
                    color={fine.status === "pending" ? "error" : "success.main"}>
                    Rs. {fine.amount}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Reason: {fine.reason}
                  </Typography>
                  <Typography variant="body2">
                    Date: {new Date(fine.createdAt).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                      label={fine.status.toUpperCase()}
                      color={fine.status === "pending" ? "warning" : "success"}
                      size="small"
                    />
                    {fine.status === "pending" && (
                      <Button variant="contained" color="success" size="small"
                        onClick={() => handlePayFine(fine._id)}>
                        Pay Fine
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </>
  );
};

export default Fines;

