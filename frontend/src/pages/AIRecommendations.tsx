import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Card, CardContent,
  AppBar, Toolbar, Button, Alert, Chip,
  TextField, CardMedia
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PsychologyIcon from "@mui/icons-material/Psychology";

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  coverImage: string;
  availableCopies: number;
  totalCopies: number;
}

interface SearchResult {
  results: Book[];
  scores: { title: string; score: string }[];
  algorithm: string;
  mlConcept: string;
}

const SmartSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        "http://localhost:5000/api/ml/smart-search?q=" + query,
        { headers: { Authorization: "Bearer " + token } }
      );
      setData(res.data);
    } catch (err) {
      setError("Search failed");
    }
    setLoading(false);
  };

  const handleBorrow = async (bookId: string) => {
    try {
      await axios.post(
        "http://localhost:5000/api/borrows/borrow",
        { memberId: user.id, bookId },
        { headers: { Authorization: "Bearer " + token } }
      );
      alert("Book borrowed!");
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed");
    }
  };

  const getScore = (title: string) => {
    if (!data?.scores) return null;
    const found = data.scores.find(s => s.title === title);
    return found ? found.score : null;
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <PsychologyIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Smart Search (TF-IDF)
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{
          p: 3, mb: 4,
          background: "linear-gradient(135deg, #3E2723, #5D4037)",
          borderRadius: 3, color: "white"
        }}>
          <Typography variant="h5" gutterBottom>
            🧠 AI-Powered Smart Search
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Uses TF-IDF algorithm to find the most relevant books
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by meaning... e.g. adventure, romance, mystery"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              sx={{
                bgcolor: "white", borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 }
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSearch}
              disabled={loading}
              startIcon={<SearchIcon />}
              sx={{ px: 3 }}
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </Box>
        </Box>

        {data && (
          <>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <Chip label={"Algorithm: " + data.algorithm} color="primary" />
              <Chip label={"ML: " + data.mlConcept} color="secondary" />
              <Chip label={data.results.length + " results found"} />
            </Box>

            {data.results.length === 0 ? (
              <Alert severity="info">
                No books found for your search. Try different keywords!
              </Alert>
            ) : (
              <Box sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 3
              }}>
                {data.results.map((book) => (
                  <Card key={book._id} sx={{ "&:hover": { boxShadow: 6 } }}>
                    {book.coverImage ? (
                      <CardMedia component="img" height="180"
                        image={book.coverImage} alt={book.title}
                        sx={{ objectFit: "cover" }} />
                    ) : (
                      <Box sx={{
                        height: 180, bgcolor: "primary.light",
                        display: "flex", alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Typography variant="h2">📚</Typography>
                      </Box>
                    )}
                    <CardContent>
                      <Typography variant="h6" noWrap>{book.title}</Typography>
                      <Typography color="textSecondary">by {book.author}</Typography>
                      <Typography variant="body2">
                        Category: {book.category || "N/A"}
                      </Typography>
                      {getScore(book.title) && (
                        <Chip
                          label={"Relevance: " + getScore(book.title)}
                          size="small"
                          color="success"
                          sx={{ mt: 1 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ mt: 1 }}
                        color={book.availableCopies > 0 ? "success.main" : "error"}>
                        Available: {book.availableCopies}/{book.totalCopies}
                      </Typography>
                      <Button
                        fullWidth variant="contained" sx={{ mt: 2 }}
                        onClick={() => handleBorrow(book._id)}
                        disabled={book.availableCopies === 0}
                      >
                        {book.availableCopies > 0 ? "Borrow" : "Unavailable"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default SmartSearch;