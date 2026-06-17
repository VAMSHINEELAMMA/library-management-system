const express = require("express");
const Book = require("../models/Book");
const User = require("../models/User");
const Borrow = require("../models/Borrow");
const Fine = require("../models/Fine");
const router = express.Router();

router.get("/summary", async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalMembers = await User.countDocuments({ role: "member" });
    const totalBorrows = await Borrow.countDocuments();
    const activeBorrows = await Borrow.countDocuments({ status: "active" });
    const returnedBorrows = await Borrow.countDocuments({ status: "returned" });
    const overdueBorrows = await Borrow.countDocuments({ status: "overdue" });
    const totalFines = await Fine.countDocuments();
    const pendingFines = await Fine.countDocuments({ status: "pending" });
    const paidFines = await Fine.countDocuments({ status: "paid" });

    const fineAmounts = await Fine.aggregate([
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const availableBooks = await Book.aggregate([
      {
        $group: {
          _id: null,
          totalCopies: { $sum: "$totalCopies" },
          availableCopies: { $sum: "$availableCopies" }
        }
      }
    ]);

    const booksByCategory = await Book.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const borrowsByMonth = await Borrow.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$borrowDate" },
            year: { $year: "$borrowDate" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);

    const topBooks = await Borrow.aggregate([
      {
        $group: {
          _id: "$bookId",
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book"
        }
      }
    ]);

    res.json({
      totalBooks,
      totalMembers,
      totalBorrows,
      activeBorrows,
      returnedBorrows,
      overdueBorrows,
      totalFines,
      pendingFines,
      paidFines,
      fineAmounts,
      availableBooks: availableBooks[0] || { totalCopies: 0, availableCopies: 0 },
      booksByCategory,
      borrowsByMonth,
      topBooks
    });
  } catch (err) {
    console.error("Reports error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
