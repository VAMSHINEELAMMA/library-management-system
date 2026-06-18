const express = require("express");
const router = express.Router();
const Borrow = require("../models/Borrow");
const Fine = require("../models/Fine");
const User = require("../models/User");

let groq = null;
let groqReady = false;

// Initialize Groq safely
try {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    const Groq = require("groq-sdk");
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    groqReady = true;
    console.log("✅ Groq SDK initialized successfully");
  } else {
    console.log("⚠️ Groq API key not found in environment");
    groqReady = false;
  }
} catch (error) {
  console.error("❌ Groq initialization error:", error.message);
  groqReady = false;
}

// Smart Search
router.get("/smart-search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    if (!groqReady) {
      return res.status(503).json({
        error: "ML service unavailable",
        message: "Groq API not configured"
      });
    }

    console.log(`🔍 Smart Search Query: ${query}`);

    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `For the search term "${query}", provide 3 alternative search keywords separated by commas. Example input: "adventure" Output: "adventure, exploration, quest"`
        }
      ]
    });

    const suggestions = message.content[0].text
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    res.json({
      query,
      suggestions,
      model: "mixtral-8x7b-32768"
    });
  } catch (error) {
    console.error("❌ Smart Search Error:", error.message);
    res.status(500).json({
      error: "Search failed",
      message: error.message.substring(0, 100)
    });
  }
});

// Reading Analytics
router.get("/reading-analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!groqReady) {
      return res.status(503).json({
        error: "ML service unavailable",
        message: "Groq API not configured"
      });
    }

    const borrows = await Borrow.find({ memberId: userId })
      .populate("bookId")
      .limit(10);

    if (borrows.length === 0) {
      return res.json({
        analysis: "No borrowing history available yet. Start borrowing books to see your reading patterns!",
        bookCount: 0
      });
    }

    const bookTitles = borrows
      .map(b => b.bookId?.title)
      .filter(t => t)
      .join(", ");

    console.log(`📊 Analytics for user: ${userId}`);

    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Analyze this reading list and provide insights about the reader's preferences in 2-3 sentences: ${bookTitles}`
        }
      ]
    });

    res.json({
      userId,
      bookCount: borrows.length,
      analysis: message.content[0].text
    });
  } catch (error) {
    console.error("❌ Analytics Error:", error.message);
    res.status(500).json({
      error: "Analytics failed",
      message: error.message.substring(0, 100)
    });
  }
});

// Overdue Prediction
router.get("/overdue-prediction/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!groqReady) {
      return res.status(503).json({
        error: "ML service unavailable",
        message: "Groq API not configured"
      });
    }

    const activeBorrows = await Borrow.find({
      memberId: userId,
      returnDate: null
    })
      .populate("bookId")
      .lean();

    if (activeBorrows.length === 0) {
      return res.json({
        prediction: "No active borrowings",
        overdueDays: 0,
        bookCount: 0
      });
    }

    const borrowDetails = activeBorrows.map(b => {
      const days = Math.floor(
        (new Date() - new Date(b.borrowDate)) / (1000 * 60 * 60 * 24)
      );
      return `${b.bookId?.title} (${days} days borrowed)`;
    });

    console.log(`⏰ Overdue prediction for user: ${userId}`);

    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Based on these borrowings: ${borrowDetails.join(", ")}, predict if the user will return books on time. Answer Yes or No with a brief reason.`
        }
      ]
    });

    res.json({
      userId,
      bookCount: activeBorrows.length,
      prediction: message.content[0].text
    });
  } catch (error) {
    console.error("❌ Prediction Error:", error.message);
    res.status(500).json({
      error: "Prediction failed",
      message: error.message.substring(0, 100)
    });
  }
});

// Fine Waiver Suggestion
router.get("/fine-waiver/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!groqReady) {
      return res.status(503).json({
        error: "ML service unavailable",
        message: "Groq API not configured"
      });
    }

    const [fines, user, borrows] = await Promise.all([
      Fine.findOne({ memberId: userId }),
      User.findById(userId),
      Borrow.find({ memberId: userId })
    ]);

    if (!fines || fines.fineBalance === 0) {
      return res.json({
        suggestion: "No outstanding fines",
        fineAmount: 0
      });
    }

    const borrowCount = borrows.length;

    console.log(`💰 Fine waiver check for user: ${userId}`);

    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `User "${user?.name}" has Rs. ${fines.fineBalance} in fines and has borrowed ${borrowCount} books total. Should the fine be waived? Yes/No with reason.`
        }
      ]
    });

    res.json({
      userId,
      fineAmount: fines.fineBalance,
      suggestion: message.content[0].text
    });
  } catch (error) {
    console.error("❌ Fine Waiver Error:", error.message);
    res.status(500).json({
      error: "Waiver check failed",
      message: error.message.substring(0, 100)
    });
  }
});

module.exports = router;