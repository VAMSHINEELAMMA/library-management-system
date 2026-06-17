import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Button, Box, Card,
  CardContent, AppBar, Toolbar, Chip, Alert
} from "@mui/material";

interface Borrow {
  _id: string;
  bookId: { title: string; author: string; isbn: string };
  memberId: { name: string; email: string };
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  status: string;
  fineAmount: number;
}

const MyBorrows: React.FC = () => {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLibrarian = user.role === "librarian" || user.role === "admin";

  useEffect(() => {
    if (!user.id) { navigate("/login"); return; }
    if (isLibrarian) {
      fetchAllBorrows();
    } else {
      fetchMyBorrows();
    }
  }, []);

  const fetchMyBorrows = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/borrows/my/" + user.id,
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      setBorrows(res.data);
    } catch (err) {
      console.log("Error fetching borrows");
    }
  };

  const fetchAllBorrows = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/borrows/all",
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      setBorrows(res.data);
    } catch (err) {
      console.log("Error fetching borrows");
    }
  };

  const handleReturn = async (borrowId: string) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/borrows/return",
        { borrowId },
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      setMessage(res.data.message);
      setError("");
      isLibrarian ? fetchAllBorrows() : fetchMyBorrows();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Return failed");
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === "active" && new Date() > new Date(dueDate);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {isLibrarian ? "All Borrowings" : "My Borrowings"}
          </Typography>
          <Button color="inherit" onClick={() => navigate("/books")}>Browse Books</Button>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h5" gutterBottom>
          {isLibrarian ? "All Borrowings" : "My Borrowed Books"} ({borrows.length})
        </Typography>

        {borrows.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6" color="textSecondary">
              No borrowings found
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 3
          }}>
            {borrows.map((borrow) => (
              <Card key={borrow._id} sx={{
                border: isOverdue(borrow.dueDate, borrow.status)
                  ? "2px solid red" : "1px solid #eee"
              }}>
                <CardContent>
                  <Typography variant="h6">
                    {borrow.bookId?.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    by {borrow.bookId?.author}
                  </Typography>
                  {isLibrarian && borrow.memberId && (
                    <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: "blue", color: "white", borderRadius: 1 }}>
                      Borrowed by: {borrow.memberId.name} ({borrow.memberId.email})
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Borrowed: {new Date(borrow.borrowDate).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Due: {new Date(borrow.dueDate).toLocaleDateString()}
                  </Typography>
                  {borrow.returnDate && (
                    <Typography variant="body2" color="success.main">
                      Returned: {new Date(borrow.returnDate).toLocaleString()}
                    </Typography>
                  )}
                  {borrow.fineAmount > 0 && (
                    <Typography variant="body2" color="error">
                      Fine: Rs. {borrow.fineAmount}
                    </Typography>
                  )}
                  {isOverdue(borrow.dueDate, borrow.status) && (
                    <Typography variant="body2" color="error">
                      OVERDUE!
                    </Typography>
                  )}
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip
                      label={isOverdue(borrow.dueDate, borrow.status) ? "OVERDUE" : borrow.status.toUpperCase()}
                      color={isOverdue(borrow.dueDate, borrow.status) ? "error" : borrow.status === "returned" ? "success" : "primary"}
                      size="small"
                    />
                    {borrow.status === "active" && (
                      <Button variant="contained" color="success" size="small"
                        onClick={() => handleReturn(borrow._id)}>
                        Return Book
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

export default MyBorrows;
