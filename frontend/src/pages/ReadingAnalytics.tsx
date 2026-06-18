import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Card, CardContent,
  AppBar, Toolbar, Button, Alert, Chip
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import InsightsIcon from "@mui/icons-material/Insights";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

const COLORS = ["#5D4037", "#FF8F00", "#1976d2", "#388e3c", "#7b1fa2"];

interface AnalyticsData {
  totalBooks: number;
  totalBorrows: number;
  favoriteGenre: string;
  monthlyData: { month: string; books: number }[];
  genreData: { genre: string; count: number }[];
  algorithm: string;
  mlConcept: string;
  insights: string;
}

const ReadingAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(
        "https://library-management-system-ih9d.onrender.com/api/ml/reading-analytics/" + user.id,
        { headers: { Authorization: "Bearer " + token } }
      );
      setData(res.data);
    } catch (err) {
      setError("Failed to load analytics");
    }
    setLoading(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <InsightsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My Reading Analytics
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Typography>Loading your reading data...</Typography>
        ) : data && (
          <>
            <Box sx={{
              p: 3, mb: 4,
              background: "linear-gradient(135deg, #3E2723, #5D4037)",
              borderRadius: 3, color: "white"
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <AutoStoriesIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">Your Reading Journey</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Powered by {data.algorithm}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                {data.insights}
              </Typography>
            </Box>

            <Box sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 3, mb: 4
            }}>
              {[
                { label: "Books Read", value: data.totalBooks, color: "#5D4037" },
                { label: "Total Borrows", value: data.totalBorrows, color: "#FF8F00" },
                { label: "Favorite Genre", value: data.favoriteGenre.split(",")[0], color: "#1976d2" },
                { label: "Genres Explored", value: data.genreData.length, color: "#388e3c" }
              ].map((stat, i) => (
                <Card key={i} sx={{ "&:hover": { boxShadow: 4 } }}>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="body2" color="textSecondary">
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" sx={{ color: stat.color, fontWeight: "bold", mt: 1 }}>
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 4 }}>
              {data.monthlyData.length > 0 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom align="center">
                    Monthly Reading Activity
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="books" fill="#5D4037" name="Books Borrowed" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {data.genreData.length > 0 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom align="center">
                    Genre Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.genreData}
                        dataKey="count"
                        nameKey="genre"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ genre, count }) =>
                          genre.split(",")[0] + ": " + count}
                      >
                        {data.genreData.map((entry, index) => (
                          <Cell key={index}
                            fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip label={"Algorithm: " + data.algorithm} color="primary" />
              <Chip label={"ML Concept: " + data.mlConcept} color="secondary" />
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default ReadingAnalytics;
