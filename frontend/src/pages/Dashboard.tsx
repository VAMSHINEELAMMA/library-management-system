import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Button, Box, Card,
  CardContent, AppBar, Toolbar, Menu, MenuItem, Chip
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  totalBooks: number;
  myBorrowings: number;
  pendingFines: number;
  activeReservations: number;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    myBorrowings: 0,
    pendingFines: 0,
    activeReservations: 0
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchStats(parsedUser);
    }
  }, [navigate]);

  const fetchStats = async (currentUser: User) => {
    try {
      const booksRes = await axios.get("https://library-management-system-ih9d.onrender.com/api/books");
      const totalBooks = booksRes.data.length;
      let myBorrowings = 0;
      let pendingFines = 0;
      let activeReservations = 0;

      if (currentUser.role === "member") {
        const borrowsRes = await axios.get(
          "https://library-management-system-ih9d.onrender.com/api/borrows/my/" + currentUser.id,
          { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
        );
        myBorrowings = borrowsRes.data.filter((b: any) => b.status === "active").length;

        const finesRes = await axios.get(
          "https://library-management-system-ih9d.onrender.com/api/fines/my/" + currentUser.id,
          { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
        );
        pendingFines = finesRes.data
          .filter((f: any) => f.status === "pending")
          .reduce((sum: number, f: any) => sum + f.amount, 0);

        const resRes = await axios.get(
          "https://library-management-system-ih9d.onrender.com/api/reservations/my/" + currentUser.id,
          { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
        );
        activeReservations = resRes.data.filter((r: any) => r.status === "pending").length;
      }

      if (currentUser.role === "librarian" || currentUser.role === "admin") {
        const borrowsRes = await axios.get(
          "https://library-management-system-ih9d.onrender.com/api/borrows/all",
          { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
        );
        myBorrowings = borrowsRes.data.filter((b: any) => b.status === "active").length;

        const finesRes = await axios.get(
          "https://library-management-system-ih9d.onrender.com/api/fines/all",
          { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
        );
        pendingFines = finesRes.data
          .filter((f: any) => f.status === "pending")
          .reduce((sum: number, f: any) => sum + f.amount, 0);
      }

      setStats({ totalBooks, myBorrowings, pendingFines, activeReservations });
    } catch (err) {
      console.log("Error fetching stats");
    }
  };

  const handleLogout = async () => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const u = JSON.parse(userData);
      try {
        await axios.post("https://library-management-system-ih9d.onrender.com/api/auth/logout", { userId: u.id });
      } catch (err) {
        console.log("Logout tracking failed");
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return <Typography>Loading...</Typography>;

  const isLibrarian = user.role === "librarian" || user.role === "admin";
  const isMember = user.role === "member";

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <LibraryBooksIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Library Management System
          </Typography>
          <Chip
            label={user.role.toUpperCase()}
            size="small"
            sx={{
              mr: 2, color: "white",
              bgcolor: isLibrarian ? "secondary.main" : "#2e7d32"
            }}
          />
          <Button color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            {user.name}
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { handleLogout(); setAnchorEl(null); }}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{
        background: "linear-gradient(135deg, #3E2723 0%, #5D4037 100%)",
        py: 4, px: 3, mb: 4
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MenuBookIcon sx={{ fontSize: 50, color: "#FFF8E1" }} />
            <Box>
              <Typography variant="h4" sx={{ color: "#FFF8E1", fontWeight: "bold" }}>
                Welcome, {user.name}!
              </Typography>
              <Typography sx={{ color: "#FFCC80" }}>
                {isLibrarian ? "Managing the library" : "Your reading journey continues"}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 3, mb: 4
        }}>
          {[
            { label: "Total Books", value: stats.totalBooks, color: "#5D4037" },
            {
              label: isLibrarian ? "Active Borrowings" : "My Borrowings",
              value: stats.myBorrowings,
              color: "#FF8F00"
            },
            {
              label: isLibrarian ? "Total Pending Fines" : "My Pending Fines",
              value: "Rs. " + stats.pendingFines,
              color: "#c62828"
            },
            ...(isMember ? [{
              label: "My Reservations",
              value: stats.activeReservations,
              color: "#1565c0"
            }] : [])
          ].map((item, i) => (
            <Card key={i} sx={{
              "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
              transition: "all 0.2s"
            }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  {item.label}
                </Typography>
                <Typography variant="h4" sx={{ color: item.color, fontWeight: "bold" }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {isMember && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, color: "primary.dark" }}>
              Member Actions
            </Typography>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 2, mb: 4
            }}>
              {[
                { label: "Browse Books", path: "/books" },
                { label: "My Borrowings", path: "/my-borrows" },
                { label: "My Fines", path: "/fines" },
                { label: "My Reservations", path: "/reservations" },
                { label: "E-Books", path: "/ebooks" },
                { label: "AI Recommendations", path: "/ai-recommendations" },
                { label: "Smart Search", path: "/smart-search" },
                { label: "Reading Analytics", path: "/reading-analytics" },
                { label: "Overdue Prediction", path: "/overdue-prediction" },
                { label: "Fine Waiver Check", path: "/fine-waiver" },
              ].map((item, i) => (
                <Button key={i} variant="contained" size="large" fullWidth
                  onClick={() => navigate(item.path)} sx={{ py: 2 }}>
                  {item.label}
                </Button>
              ))}
            </Box>
          </>
        )}

        {isLibrarian && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 2, color: "primary.dark" }}>
              Librarian Actions
            </Typography>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 2, mb: 4
            }}>
              {[
                { label: "Add New Book", path: "/add-book" },
                { label: "Manage Books", path: "/books" },
                { label: "Manage Members", path: "/members" },
                { label: "All Borrowings", path: "/my-borrows" },
                { label: "Manage Fines", path: "/fines" },
                { label: "E-Books", path: "/ebooks" },
                { label: "Reports & Analytics", path: "/reports" }
              ].map((item, i) => (
                <Button key={i} variant="contained" color="secondary"
                  size="large" fullWidth
                  onClick={() => navigate(item.path)} sx={{ py: 2 }}>
                  {item.label}
                </Button>
              ))}
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default Dashboard;

