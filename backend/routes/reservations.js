const express = require('express');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const router = express.Router();

// Create reservation
router.post('/', async (req, res) => {
  try {
    const { memberId, bookId } = req.body;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ msg: 'Book not found' });

    // Check if already reserved
    const existing = await Reservation.findOne({ 
      memberId, bookId, status: { $in: ['pending', 'ready'] }
    });
    if (existing) return res.status(400).json({ msg: 'Already reserved this book' });

    const reservation = new Reservation({ memberId, bookId });
    await reservation.save();

    const populated = await Reservation.findById(reservation._id)
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email');

    res.status(201).json({ msg: 'Book reserved!', reservation: populated });
  } catch (err) {
    console.error('Reservation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get member reservations
router.get('/my/:memberId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ memberId: req.params.memberId })
      .populate('bookId', 'title author isbn category availableCopies')
      .populate('memberId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel reservation
router.put('/cancel/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    res.json({ msg: 'Reservation cancelled', reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all reservations (admin)
router.get('/', async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('bookId', 'title author isbn')
      .populate('memberId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;