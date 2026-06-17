const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  isbn: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: String,
  totalCopies: { type: Number, required: true },
  availableCopies: { type: Number, required: true },
  price: Number,
  publishYear: Number,
  description: String,
  coverImage: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', BookSchema);