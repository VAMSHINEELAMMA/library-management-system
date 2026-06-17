import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Button, Box, Card, CardContent,
  CardActions, CardMedia, Typography, AppBar,
  Toolbar, TextField, Alert, Chip
} from "@mui/material";

interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  availableCopies: number;
  totalCopies: number;
  price: number;
  publishYear: number;
  description: string;
  coverImage: string;
}

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const isLibrarian = user.role === "librarian" || user.role === "admin";

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/books",
        { headers: { Authorization: "Bearer " + token } }
      );
      setBooks(res.data);
      setFilteredBooks(res.data);
    } catch (err) {
      console.log("Error fetching books");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = books.filter(book =>
      book.title.toLowerCase().includes(value.toLowerCase()) ||
      book.author.toLowerCase().includes(value.toLowerCase()) ||
      book.category?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBooks(filtered);
  };

  const handleBorrow = async (bookId: string) => {
    try {
      await axios.post(
        "http://localhost:5000/api/borrows/borrow",
        { memberId: user.id, bookId },
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("Book borrowed successfully!");
      setError("");
      fetchBooks();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to borrow book");
      setMessage("");
    }
  };

  const handleReserve = async (bookId: string) => {
    try {
      await axios.post(
        "http://localhost:5000/api/reservations",
        { memberId: user.id, bookId },
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("Book reserved successfully!");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to reserve");
      setMessage("");
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      await axios.delete(
        "http://localhost:5000/api/books/" + bookId,
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("Book deleted!");
      fetchBooks();
    } catch (err) {
      setError("Failed to delete book");
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {isLibrarian ? "Manage Books" : "Browse Books"}
          </Typography>
          {isLibrarian && (
            <Button color="inherit" onClick={() => navigate("/add-book")}>
              ➕ Add Book
            </Button>
          )}
          {!isLibrarian && (
            <Button color="inherit" onClick={() => navigate("/my-borrows")}>
              My Borrows
            </Button>
          )}
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          placeholder="Search by title, author or category..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Typography variant="h6" gutterBottom>
          {filteredBooks.length} Books Found
        </Typography>

        <Box sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 3
        }}>
          {filteredBooks.map((book) => (
            <Card key={book._id} sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              "&:hover": { boxShadow: 6 },
              transition: "all 0.3s ease"
            }}>
              {book.coverImage ? (
                <CardMedia
                  component="img"
                  height="220"
                  image={book.coverImage}
                  alt={book.title}
                  sx={{ objectFit: "cover" }}
                />
              ) : (
                <Box sx={{
                  height: 220,
                  bgcolor: "grey.200",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Typography variant="h2">📚</Typography>
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                  {book.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  by {book.author}
                </Typography>

                <Box sx={{ mt: 2, mb: 1 }}>
                  {book.isbn && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>ISBN:</strong> {book.isbn}
                    </Typography>
                  )}
                  {book.category && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Category:</strong> {book.category}
                    </Typography>
                  )}
                  {book.publishYear > 0 && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Year:</strong> {book.publishYear}
                    </Typography>
                  )}
                  {book.price > 0 && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Price:</strong> Rs. {book.price}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={`Available: ${book.availableCopies}/${book.totalCopies}`}
                    color={book.availableCopies > 0 ? "success" : "error"}
                    size="small"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ gap: 1, p: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {isLibrarian ? (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => navigate("/edit-book/" + book._id)}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(book._id)}
                    >
                      🗑️ Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleBorrow(book._id)}
                      disabled={book.availableCopies === 0}
                    >
                      {book.availableCopies > 0 ? "📖 Borrow" : "Unavailable"}
                    </Button>
                    {book.availableCopies === 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleReserve(book._id)}
                      >
                        📋 Reserve
                      </Button>
                    )}
                  </>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
      </Container>
    </>
  );
};

export default Books;