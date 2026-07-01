const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const EBook = require("../models/EBook");

const router = express.Router();

// Use /tmp for Render, local uploads for dev
const ebooksDir = process.env.NODE_ENV === "production" 
  ? path.join("/tmp", "ebooks")
  : path.join(__dirname, "../uploads/ebooks");

if (!fs.existsSync(ebooksDir)) {
  fs.mkdirSync(ebooksDir, { recursive: true });
}

console.log("EBooks dir:", ebooksDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ebooksDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// GET all ebooks
router.get("/", async (req, res) => {
  try {
    const ebooks = await EBook.find();
    res.json(ebooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Add new ebook
router.post("/", upload.single("pdfFile"), async (req, res) => {
  try {
    const { title, author, category } = req.body;

    if (!req.file) return res.status(400).json({ error: "PDF required" });
    if (!title || !author) return res.status(400).json({ error: "Title and author required" });

    const ebook = new EBook({
      title,
      author,
      category: category || "General",
      fileName: req.file.filename,
      pdfPath: `/uploads/ebooks/${req.file.filename}`
    });

    await ebook.save();
    res.json({ success: true, ebook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Download ebook by ID (CHANGED: was PUT, now GET)
router.get("/download/:id", async (req, res) => {
  try {
    const ebook = await EBook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ error: "EBook not found" });

    const filePath = path.join(ebooksDir, ebook.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Send file for download
    res.download(filePath, ebook.fileName);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Delete ebook
router.delete("/:id", async (req, res) => {
  try {
    const ebook = await EBook.findByIdAndDelete(req.params.id);

    if (ebook) {
      const filePath = path.join(ebooksDir, ebook.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;