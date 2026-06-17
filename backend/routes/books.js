const express = require("express");
const multer = require("multer");
const path = require("path");
const Book = require("../models/Book");
const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Get all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create book with image
router.post("/", upload.single("coverImage"), async (req, res) => {
  try {
    const { isbn, title, author, category, totalCopies, price, publishYear, description } = req.body;

    let book = await Book.findOne({ isbn });
    if (book) return res.status(400).json({ msg: "Book already exists" });

    const coverImage = req.file ? "http://localhost:5000/uploads/" + req.file.filename : "";

    book = new Book({
      isbn,
      title,
      author,
      category,
      totalCopies: Number(totalCopies),
      availableCopies: Number(totalCopies),
      price: Number(price) || 0,
      publishYear: Number(publishYear) || 0,
      description,
      coverImage
    });

    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single book
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update book
router.put("/:id", upload.single("coverImage"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.coverImage = "http://localhost:5000/uploads/" + req.file.filename;
    }
    const book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete book
router.delete("/:id", async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ msg: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search books
router.get("/search/:query", async (req, res) => {
  try {
    const books = await Book.find({
      $or: [
        { title: { $regex: req.params.query, $options: "i" } },
        { author: { $regex: req.params.query, $options: "i" } }
      ]
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
