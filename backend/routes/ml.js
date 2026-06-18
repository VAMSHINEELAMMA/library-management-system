const express = require("express");
const router = express.Router();
const Borrow = require("../models/Borrow");
const Fine = require("../models/Fine");
const User = require("../models/User");

// Check if Groq is available
let groqAvailable = false;
let groq = null;

try {
  if (process.env.GROQ_API_KEY) {
    const Groq = require("groq-sdk");
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    groqAvailable = true;
  }
} catch (err) {
  console.log("⚠️ Groq SDK not available, ML features disabled");
  groqAvailable = false;
}

// Helper: Handle Groq unavailable
const checkGroq = (res) => {
  if (!groqAvailable) {
    return res.status(503).json({ 
      error: "ML features not available",
      message: "Groq API key not configured" 
    });
  }
  return null;
};

// Smart Search
router.get("/smart-search", async (req, res) => {
  const error = checkGroq(res);
  if (error) return error;
  
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query required" });
    
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Given this search query: "${query}", suggest 3 book search terms. Return only the terms separated by commas.`
        }
      ]
    });
    
    const suggestions = message.content[0].text.split(",").map(s => s.trim());
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reading Analytics
router.get("/reading-analytics/:userId", async (req, res) => {
  const error = checkGroq(res);
  if (error) return error;
  
  try {
    const { userId } = req.params;
    const borrows = await Borrow.find({ memberId: userId }).populate("bookId");
    
    if (borrows.length === 0) {
      return res.json({ analysis: "No reading history available yet." });
    }
    
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Analyze these books: ${borrows.map(b => b.bookId?.title).join(", ")}. Provide 2-3 sentences on reading patterns.`
        }
      ]
    });
    
    res.json({ analysis: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Overdue Prediction
router.get("/overdue-prediction/:userId", async (req, res) => {
  const error = checkGroq(res);
  if (error) return error;
  
  try {
    const { userId } = req.params;
    const borrows = await Borrow.find({ 
      memberId: userId, 
      returnDate: null 
    }).populate("bookId");
    
    if (borrows.length === 0) {
      return res.json({ prediction: "No active borrowings." });
    }
    
    const daysOverdue = borrows.map(b => {
      const days = Math.floor((new Date() - b.borrowDate) / (1000 * 60 * 60 * 24));
      return `${b.bookId?.title}: ${days} days`;
    }).join(", ");
    
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Books borrowed: ${daysOverdue}. Predict if user will return soon? Yes/No with reason.`
        }
      ]
    });
    
    res.json({ prediction: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fine Waiver Suggestion
router.get("/fine-waiver/:userId", async (req, res) => {
  const error = checkGroq(res);
  if (error) return error;
  
  try {
    const { userId } = req.params;
    const fines = await Fine.findOne({ memberId: userId });
    const user = await User.findById(userId);
    
    if (!fines || fines.fineBalance === 0) {
      return res.json({ suggestion: "No outstanding fines." });
    }
    
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Member "${user?.name}" has fine of Rs. ${fines?.fineBalance}. Should fine be waived? Yes/No with reason.`
        }
      ]
    });
    
    res.json({ suggestion: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;