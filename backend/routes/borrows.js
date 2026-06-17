const express = require('express');
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const Fine = require('../models/Fine');
const User = require('../models/User');
const router = express.Router();

// Borrow a book
router.post('/borrow', async (req, res) => {
  try {
    const { memberId, bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ msg: 'Book not found' });
    if (book.availableCopies <= 0) return res.status(400).json({ msg: 'No copies available' });

    const existing = await Borrow.findOne({ memberId, bookId, status: 'active' });
    if (existing) return res.status(400).json({ msg: 'You already borrowed this book' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const borrow = new Borrow({ memberId, bookId, dueDate });
    await borrow.save();

    book.availableCopies -= 1;
    await book.save();

    const populated = await Borrow.findById(borrow._id)
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email');

    res.status(201).json({ msg: 'Book borrowed successfully!', borrow: populated });
  } catch (err) {
    console.error('Borrow error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Return a book
router.post('/return', async (req, res) => {
  try {
    const { borrowId } = req.body;

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) return res.status(404).json({ msg: 'Borrow record not found' });
    if (borrow.status === 'returned') return res.status(400).json({ msg: 'Book already returned' });

    const today = new Date();
    let fineAmount = 0;
    if (today > borrow.dueDate) {
      const daysOverdue = Math.ceil((today - borrow.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 5;
    }

    borrow.returnDate = today;
    borrow.status = 'returned';
    borrow.fineAmount = fineAmount;
    await borrow.save();

    await Book.findByIdAndUpdate(borrow.bookId, { $inc: { availableCopies: 1 } });

    if (fineAmount > 0) {
      const fine = new Fine({
        memberId: borrow.memberId,
        borrowId: borrow._id,
        amount: fineAmount,
        reason: 'Overdue book return'
      });
      await fine.save();
      await User.findByIdAndUpdate(borrow.memberId, { $inc: { fineBalance: fineAmount } });
    }

    res.json({
      msg: 'Book returned successfully!',
      fineAmount,
      message: fineAmount > 0 ? `Fine of Rs. ${fineAmount} applied` : 'No fine - returned on time!'
    });
  } catch (err) {
    console.error('Return error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get borrows for a member
router.get('/my/:memberId', async (req, res) => {
  try {
    const borrows = await Borrow.find({ memberId: req.params.memberId })
      .populate('bookId', 'title author isbn category')
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all borrows (admin)
router.get('/all', async (req, res) => {
  try {
    const borrows = await Borrow.find()
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email')
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;