import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Button, Box, Card, CardContent,
  AppBar, Toolbar, TextField, Alert, Paper
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DeleteIcon from "@mui/icons-material/Delete";

interface EBook {
  _id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  downloads: number;
  createdAt: string;
}

const EBooks: React.FC = () => {
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [filtered, setFiltered] = useState<EBook[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({
    title: "", author: "", category: "", description: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const isLibrarian = user.role === "librarian" || user.role === "admin";

  useEffect(() => {
    fetchEBooks();
  }, []);

  const fetchEBooks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/ebooks",
        { headers: { Authorization: "Bearer " + token } }
      );
      setEbooks(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.log("Error fetching ebooks");
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    const f = ebooks.filter(e =>
      e.title.toLowerCase().includes(value.toLowerCase()) ||
      e.author.toLowerCase().includes(value.toLowerCase()) ||
      e.category.toLowerCase().includes(value.toLowerCase())
    );
    setFiltered(f);
  };

  const handleDownload = async (ebook: EBook) => {
    try {
      await axios.put(
        "http://localhost:5000/api/ebooks/download/" + ebook._id,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );
      window.open(ebook.fileUrl, "_blank");
      fetchEBooks();
    } catch (err) {
      console.log("Download error");
      window.open(ebook.fileUrl, "_blank");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this ebook?")) return;
    try {
      await axios.delete(
        "http://localhost:5000/api/ebooks/" + id,
        { headers: { Authorization: "Bearer " + token } }
      );
      setMessage("EBook deleted!");
      fetchEBooks();
    } catch (err) {
      setError("Failed to delete");
    }
  };

  const handleUpload = async () => {
    if (!file || !formData.title || !formData.author) {
      setError("Title, author and PDF file are required");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("author", formData.author);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("ebook", file);

      await axios.post("http://localhost:5000/api/ebooks", data, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage("EBook uploaded successfully!");
      setError("");
      setFormData({ title: "", author: "", category: "", description: "" });
      setFile(null);
      setShowUpload(false);
      fetchEBooks();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Upload failed");
    }
    setLoading(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <MenuBookIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            E-Books Library
          </Typography>
          {isLibrarian && (
            <Button
              color="inherit"
              startIcon={<UploadFileIcon />}
              onClick={() => setShowUpload(!showUpload)}
            >
              Upload EBook
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

        {isLibrarian && showUpload && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Upload New E-Book</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField fullWidth label="Title *" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <TextField fullWidth label="Author *" value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
              <TextField fullWidth label="Category" value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              <TextField fullWidth label="Description" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
                {file ? "Selected: " + file.name : "Choose PDF File *"}
                <input type="file" hidden accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Button variant="contained" onClick={handleUpload} disabled={loading}>
                {loading ? "Uploading..." : "Upload E-Book"}
              </Button>
              <Button variant="outlined" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </Box>
          </Paper>
        )}

        <TextField
          fullWidth
          placeholder="Search ebooks by title, author or category..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="h6" gutterBottom>
          {filtered.length} E-Books Available
        </Typography>

        {filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <MenuBookIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No e-books available yet
            </Typography>
            {isLibrarian && (
              <Button variant="contained" sx={{ mt: 2 }}
                onClick={() => setShowUpload(true)}>
                Upload First E-Book
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 3
          }}>
            {filtered.map((ebook) => (
              <Card key={ebook._id} sx={{ "&:hover": { boxShadow: 6 } }}>
                <Box sx={{
                  height: 120,
                  background: "linear-gradient(135deg, #5D4037, #8D6E63)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MenuBookIcon sx={{ fontSize: 60, color: "white" }} />
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom noWrap>
                    {ebook.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    by {ebook.author}
                  </Typography>
                  {ebook.category && (
                    <Typography variant="body2">
                      Category: {ebook.category}
                    </Typography>
                  )}
                  {ebook.description && (
                    <Typography variant="body2" color="textSecondary"
                      sx={{ mt: 1, display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden" }}>
                      {ebook.description}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Size: {ebook.fileSize}
                  </Typography>
                  <Typography variant="body2">
                    Downloads: {ebook.downloads}
                  </Typography>
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(ebook)}
                      fullWidth
                    >
                      Download PDF
                    </Button>
                    {isLibrarian && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(ebook._id)}
                      >
                        <DeleteIcon />
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

export default EBooks;
