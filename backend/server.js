const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  console.log(req.method + " " + req.path);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const borrowRoutes = require("./routes/borrows");
const fineRoutes = require("./routes/fines");
const memberRoutes = require("./routes/members");
const reservationRoutes = require("./routes/reservations");
const reportRoutes = require("./routes/reports");
const mlRoutes = require("./routes/ml");
const ebookRoutes = require("./routes/ebooks");

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/ebooks", ebookRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Serve React app for any non-API route
app.use((req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ msg: "Route not found: " + req.method + " " + req.path });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("✅ Server running on http://localhost:" + PORT);
});