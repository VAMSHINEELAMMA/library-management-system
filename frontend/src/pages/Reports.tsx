import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Card, CardContent,
  AppBar, Toolbar, Button, Alert
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ReportData {
  totalBooks: number;
  totalMembers: number;
  totalBorrows: number;
  activeBorrows: number;
  returnedBorrows: number;
  overdueBorrows: number;
  totalFines: number;
  pendingFines: number;
  paidFines: number;
  fineAmounts: { _id: string; total: number }[];
  availableBooks: { totalCopies: number; availableCopies: number };
  booksByCategory: { _id: string; count: number }[];
  borrowsByMonth: { _id: { month: number; year: number }; count: number }[];
  topBooks: { _id: string; borrowCount: number; book: { title: string }[] }[];
}

const Reports: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reports/summary",
        { headers: { Authorization: "Bearer " + token } }
      );
      setData(res.data);
    } catch (err: any) {
      setError("Failed to load reports");
    }
  };

  if (!data) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Typography>Loading reports...</Typography>
    </Box>
  );

  const borrowStatusData = [
    { name: "Active", value: data.activeBorrows },
    { name: "Returned", value: data.returnedBorrows },
    { name: "Overdue", value: data.overdueBorrows }
  ];

  const fineStatusData = [
    { name: "Pending", value: data.pendingFines },
    { name: "Paid", value: data.paidFines }
  ];

  const bookAvailabilityData = [
    {
      name: "Books",
      Total: data.availableBooks.totalCopies,
      Available: data.availableBooks.availableCopies,
      Borrowed: data.availableBooks.totalCopies - data.availableBooks.availableCopies
    }
  ];

  const categoryData = data.booksByCategory.map(c => ({
    name: c._id || "Unknown",
    count: c.count
  }));

  const monthlyData = data.borrowsByMonth.map(b => ({
    name: MONTHS[b._id.month - 1] + " " + b._id.year,
    borrows: b.count
  }));

  const topBooksData = data.topBooks.map(b => ({
    name: b.book[0]?.title || "Unknown",
    borrows: b.borrowCount
  }));

  const fineAmountData = data.fineAmounts.map(f => ({
    name: f._id,
    amount: f.total
  }));

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Reports & Analytics
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Summary Cards */}
        <Typography variant="h5" gutterBottom>Summary</Typography>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 2,
          mb: 4
        }}>
          {[
            { label: "Total Books", value: data.totalBooks, color: "#1976d2" },
            { label: "Total Members", value: data.totalMembers, color: "#388e3c" },
            { label: "Total Borrows", value: data.totalBorrows, color: "#f57c00" },
            { label: "Active Borrows", value: data.activeBorrows, color: "#7b1fa2" },
            { label: "Overdue", value: data.overdueBorrows, color: "#d32f2f" },
            { label: "Total Fines", value: data.totalFines, color: "#c62828" },
            { label: "Pending Fines", value: data.pendingFines, color: "#e65100" },
            { label: "Paid Fines", value: data.paidFines, color: "#2e7d32" }
          ].map((item, i) => (
            <Card key={i} sx={{ "&:hover": { boxShadow: 4 } }}>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="textSecondary">
                  {item.label}
                </Typography>
                <Typography variant="h4" sx={{ color: item.color, fontWeight: "bold" }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Borrow Status Pie Chart */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 4 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              Borrow Status
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={borrowStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => name + ": " + value}
                >
                  {borrowStatusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom align="center">
              Fine Status
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fineStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => name + ": " + value}
                >
                  {fineStatusData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Box>

        {/* Book Availability Bar Chart */}
        <Card sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom align="center">
            Book Availability
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookAvailabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#1976d2" />
              <Bar dataKey="Available" fill="#388e3c" />
              <Bar dataKey="Borrowed" fill="#f57c00" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Borrows Line Chart */}
        {monthlyData.length > 0 && (
          <Card sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom align="center">
              Monthly Borrowings
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="borrows"
                  stroke="#1976d2"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Books by Category */}
        {categoryData.length > 0 && (
          <Card sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom align="center">
              Books by Category
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#7b1fa2" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Borrowed Books */}
        {topBooksData.length > 0 && (
          <Card sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom align="center">
              Top Borrowed Books
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topBooksData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="borrows" fill="#f57c00" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Fine Amounts */}
        {fineAmountData.length > 0 && (
          <Card sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom align="center">
              Fine Amounts (Rs.)
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fineAmountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#d32f2f" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </Container>
    </>
  );
};

export default Reports;
