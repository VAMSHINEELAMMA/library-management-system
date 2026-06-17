const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  status: { type: String, enum: ['pending', 'ready', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);