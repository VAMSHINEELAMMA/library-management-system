const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Book = require("../models/Book");

const router = express.Router();

// Create uploads folder if doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// GET all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new book
router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    let coverImage = null;

    // Convert uploaded image to base64
    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64 = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype; // image/jpeg, image/png
      coverImage = `data:${mimeType};base64,${base64}`;

      // Delete temp file
      fs.unlinkSync(req.file.path);
    }

    const book = new Book({
      title,
      author,
      isbn,
      category,
      totalCopies,
      availableCopies: totalCopies,
      coverImage
    });

    await book.save();
    res.json({ success: true, book });
  } catch (err) {
    console.error("Error adding book:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// EDIT book
router.put("/:id", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;

    const updateData = {
      title,
      author,
      isbn,
      category,
      totalCopies
    };

    // Update image only if new one uploaded
    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64 = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype;
      updateData.coverImage = `data:${mimeType};base64,${base64}`;

      // Delete temp file
      fs.unlinkSync(req.file.path);
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, book });
  } catch (err) {
    console.error("Error updating book:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE book
router.delete("/:id", async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;