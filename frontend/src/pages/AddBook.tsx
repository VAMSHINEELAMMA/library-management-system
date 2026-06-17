import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, TextField, Button, Box,
  Typography, Alert, Paper, AppBar, Toolbar
} from "@mui/material";

const AddBook: React.FC = () => {
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    if (!formData.isbn || !formData.title || !formData.author || !formData.totalCopies) {
      setError("ISBN, Title, Author and Copies are required");
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

      await axios.post("http://localhost:5000/api/books", data, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
          "Content-Type": "multipart/form-data"
        }
      });

      setSuccess("Book added successfully!");
      setFormData({
        isbn: "", title: "", author: "", category: "",
        totalCopies: "", price: "", publishYear: "", description: ""
      });
      setCoverImage(null);
      setPreview("");
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to add book");
    }
    setLoading(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Add New Book</Typography>
          <Button color="inherit" onClick={() => navigate("/books")}>Books</Button>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Add New Book</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <TextField fullWidth label="ISBN" name="isbn"
            value={formData.isbn} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Title" name="title"
            value={formData.title} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Author" name="author"
            value={formData.author} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Category" name="category"
            value={formData.category} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Total Copies" name="totalCopies"
            type="number" value={formData.totalCopies} onChange={handleChange} margin="normal" required />
          <TextField fullWidth label="Price (Rs.)" name="price"
            type="number" value={formData.price} onChange={handleChange} margin="normal" />
          <TextField fullWidth label="Publish Year" name="publishYear"
            type="number" value={formData.publishYear} onChange={handleChange} margin="normal" />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 1 }}
            onClick={async () => {
              if (!formData.title || !formData.author) {
                setError("Enter title and author first");
                return;
              }

              try {
                setLoading(true);

                const res = await axios.post(
                  "http://localhost:5000/api/ml/generate-summary",
                  {
                    title: formData.title,
                    author: formData.author,
                    category: formData.category
                  },
                  {
                    headers: {
                      Authorization: "Bearer " + localStorage.getItem("token")
                    }
                  }
                );

                setFormData({
                  ...formData,
                  description: res.data.summary
                });

                setSuccess("AI summary generated successfully!");
              } catch (err) {
                setError("Failed to generate summary");
              } finally {
                setLoading(false);
              }
            }}
          >
            🤖 Generate AI Summary
          </Button>

          <Box sx={{ mt: 2 }}></Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Book Cover Image (Optional)
            </Typography>
            <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
              Choose Image
              <input type="file" hidden accept="image/*" onChange={handleImageChange} />
            </Button>
            {preview && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "150px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #ddd"
                  }}
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Preview
                </Typography>
              </Box>
            )}
          </Box>

          <Button fullWidth variant="contained" size="large"
            sx={{ mt: 3 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Book"}
          </Button>
        </Paper>
      </Container>
    </>
  );
};

export default AddBook;
