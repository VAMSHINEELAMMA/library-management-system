const mongoose = require('mongoose');

const BorrowSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  fineAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Borrow', BorrowSchema);