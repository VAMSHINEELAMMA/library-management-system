const mongoose = require("mongoose");

const FineSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  borrowId: { type: mongoose.Schema.Types.ObjectId, ref: "Borrow", default: null },
  amount: { type: Number, required: true },
  reason: { type: String, default: "Overdue book" },
  status: { type: String, enum: ["pending", "paid"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Fine", FineSchema);
