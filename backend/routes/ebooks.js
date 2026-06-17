const express = require("express");
const multer = require("multer");
const path = require("path");
const EBook = require("../models/EBook");
const router = express.Router();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/ebooks/");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });

// Upload ebook (librarian)
router.post("/", upload.single("ebook"), async (req, res) => {
  try {
    console.log("Upload ebook request:", req.body);
    if (!req.file) {
      return res.status(400).json({ msg: "Please upload a PDF file" });
    }

    const { title, author, category, description } = req.body;
    if (!title || !author) {
      return res.status(400).json({ msg: "Title and author required" });
    }

    const fileUrl = "http://localhost:5000/uploads/ebooks/" + req.file.filename;
    const fileSize = (req.file.size / 1024 / 1024).toFixed(2) + " MB";

    const ebook = new EBook({
      title,
      author,
      category: category || "",
      description: description || "",
      fileName: req.file.originalname,
      fileUrl,
      fileSize
    });

    await ebook.save();
    console.log("EBook saved:", ebook.title);
    res.status(201).json({ msg: "EBook uploaded successfully!", ebook });
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all ebooks
router.get("/", async (req, res) => {
  try {
    const ebooks = await EBook.find().sort({ createdAt: -1 });
    res.json(ebooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download ebook (increment counter)
router.put("/download/:id", async (req, res) => {
  try {
    const ebook = await EBook.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    res.json({ msg: "Download tracked", fileUrl: ebook.fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ebook (librarian)
router.delete("/:id", async (req, res) => {
  try {
    await EBook.findByIdAndDelete(req.params.id);
    res.json({ msg: "EBook deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
