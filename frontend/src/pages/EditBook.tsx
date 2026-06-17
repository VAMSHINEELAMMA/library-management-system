import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Container, TextField, Button, Box,
  Typography, Alert, Paper, AppBar, Toolbar
} from "@mui/material";

const EditBook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    isbn: "",
    title: "",
    author: "",
    category: "",
    totalCopies: "",
    price: "",
    publishYear: "",
    description: ""
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBook();
  }, []);

  const fetchBook = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/books/" + id,
        { headers: { Authorization: "Bearer " + token } }
      );
      const book = res.data;
      setFormData({
        isbn: book.isbn || "",
        title: book.title || "",
        author: book.author || "",
        category: book.category || "",
        totalCopies: book.totalCopies?.toString() || "",
        price: book.price?.toString() || "",
        publishYear: book.publishYear?.toString() || "",
        description: book.description || ""
      });
      setCurrentImage(book.coverImage || "");
    } catch (err) {
      setError("Failed to load book");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.title || !formData.author) {
      setError("Title and Author are required");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("isbn", formData.isbn);
      data.append("title", formData.title);
      data.append("author", formData.author);
      data.append("category", formData.category);
      data.append("totalCopies", formData.totalCopies);
      data.append("price", formData.price);
      data.append("publishYear", formData.publishYear);
      data.append("description", formData.description);
      if (coverImage) {
        data.append("coverImage", coverImage);
      }

      await axios.put(
        "http://localhost:5000/api/books/" + id,
        data,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setSuccess("Book updated successfully!");
      setTimeout(() => navigate("/books"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to update book");
    }
    setLoading(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Edit Book</Typography>
          <Button color="inherit" onClick={() => navigate("/books")}>Books</Button>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Edit Book Details</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField fullWidth label="ISBN" name="isbn"
            value={formData.isbn} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Title" name="title"
            value={formData.title} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Author" name="author"
            value={formData.author} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Category" name="category"
            value={formData.category} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Total Copies" name="totalCopies"
            type="number" value={formData.totalCopies} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Price (Rs.)" name="price"
            type="number" value={formData.price} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Publish Year" name="publishYear"
            type="number" value={formData.publishYear} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Description" name="description"
            value={formData.description} onChange={handleChange}
            margin="normal" multiline rows={3} />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>Book Cover Image</Typography>

            {currentImage && !preview && (
              <Box sx={{ mb: 2, textAlign: "center" }}>
                <Typography variant="body2" color="textSecondary">
                  Current Image:
                </Typography>
                <img
                  src={currentImage}
                  alt="Current cover"
                  style={{
                    width: "150px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    marginTop: "8px"
                  }}
                />
              </Box>
            )}

            <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
              {currentImage ? "Change Image" : "Choose Image"}
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </Button>

            {preview && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <img
                  src={preview}
                  alt="New preview"
                  style={{
                    width: "150px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ddd"
                  }}
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  New Image Preview
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Book"}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate("/books")}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default EditBook;
