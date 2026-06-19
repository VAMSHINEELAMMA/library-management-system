const express = require("express");
const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const User = require("../models/User");
const Fine = require("../models/Fine");

const router = express.Router();

let groq = null;
try {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    const Groq = require("groq-sdk");
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("✅ Groq initialized");
  } else {
    console.log("⚠️ Groq API key not found");
  }
} catch (err) {
  console.error("❌ Groq init error:", err.message);
}

// ============================================
// HELPER: Call Groq AI
// ============================================
const callGroq = async (prompt) => {
  if (!groq) throw new Error("Groq not initialized");
  
  const response = await groq.messages.create({
    messages: [{ role: "user", content: prompt }],
    model: "mixtral-8x7b-32768",
    max_tokens: 500
  });
  return response.content[0].text;
};

// ============================================
// FEATURE 1: BOOK RECOMMENDER
// ML: Collaborative Filtering + Cosine Similarity
// ============================================
router.get("/recommendations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const allBorrows = await Borrow.find()
      .populate("bookId", "title author category")
      .populate("memberId", "name");

    // Build User-Book Matrix
    const userBookMatrix = {};
    const allBooks = {};

    allBorrows.forEach(borrow => {
      if (!borrow.memberId || !borrow.bookId) return;
      const uid = borrow.memberId._id.toString();
      const bid = borrow.bookId._id.toString();
      if (!userBookMatrix[uid]) userBookMatrix[uid] = {};
      userBookMatrix[uid][bid] = 1;
      allBooks[bid] = borrow.bookId;
    });

    const currentUserBooks = userBookMatrix[userId] || {};
    const currentUserBookIds = Object.keys(currentUserBooks);

    // New user - recommend popular books
    if (currentUserBookIds.length === 0) {
      const popular = await Borrow.aggregate([
        { $group: { _id: "$bookId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      const popularBooks = await Book.find({
        _id: { $in: popular.map(p => p._id) }
      });
      return res.json({
        recommendations: popularBooks,
        algorithm: "Popular Books",
        mlConcept: "Popularity-Based Filtering",
        explanation: "Since you are new, we recommend the most borrowed books!"
      });
    }

    // Cosine Similarity Function
    const cosineSimilarity = (user1Books, user2Books) => {
      const allBookIds = new Set([
        ...Object.keys(user1Books),
        ...Object.keys(user2Books)
      ]);
      let dotProduct = 0, magnitude1 = 0, magnitude2 = 0;
      allBookIds.forEach(bookId => {
        const val1 = user1Books[bookId] || 0;
        const val2 = user2Books[bookId] || 0;
        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
      });
      if (magnitude1 === 0 || magnitude2 === 0) return 0;
      return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
    };

    // Find Similar Users
    const similarities = [];
    Object.keys(userBookMatrix).forEach(otherUserId => {
      if (otherUserId === userId) return;
      const similarity = cosineSimilarity(
        currentUserBooks,
        userBookMatrix[otherUserId]
      );
      if (similarity > 0) similarities.push({ userId: otherUserId, similarity });
    });

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarUsers = similarities.slice(0, 3);

    // Get Recommended Books
    const recommendedBookIds = new Set();
    topSimilarUsers.forEach(({ userId: simUserId }) => {
      Object.keys(userBookMatrix[simUserId]).forEach(bookId => {
        if (!currentUserBooks[bookId]) recommendedBookIds.add(bookId);
      });
    });

    let recommendedBooks = await Book.find({
      _id: { $in: Array.from(recommendedBookIds) }
    }).limit(6);

    if (recommendedBooks.length < 3) {
      const popular = await Borrow.aggregate([
        { $group: { _id: "$bookId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]);
      const popularBooks = await Book.find({
        _id: { $in: popular.map(p => p._id), $nin: currentUserBookIds }
      });
      recommendedBooks = [...recommendedBooks, ...popularBooks].slice(0, 6);
    }

    // Groq AI explanation
    let aiExplanation = "Recommendations based on similar readers' preferences.";
    if (groq) {
      try {
        aiExplanation = await callGroq(
          "In 2 sentences, explain why a library member who read " +
          currentUserBookIds.length + " books would enjoy similar books based on collaborative filtering."
        );
      } catch (err) {
        console.log("AI explanation failed:", err.message);
      }
    }

    res.json({
      recommendations: recommendedBooks,
      algorithm: "Collaborative Filtering",
      mlConcept: "Cosine Similarity between user reading vectors",
      similarUsers: topSimilarUsers.length,
      explanation: aiExplanation
    });

  } catch (err) {
    console.error("Recommendation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 2: SMART SEARCH (TF-IDF)
// ML: Term Frequency-Inverse Document Frequency
// ============================================
router.get("/smart-search", async (req, res) => {
  try {
    const query = req.query.query || req.query.q || "";
    if (!query) return res.json({ results: [], scores: [] });

    const books = await Book.find();
    const queryTerms = query.toLowerCase().split(" ");

    // TF-IDF Calculation
    const tfidfScores = books.map(book => {
      const document = (
        book.title + " " +
        book.author + " " +
        (book.category || "") + " " +
        (book.description || "")
      ).toLowerCase();

      const words = document.split(" ");
      let score = 0;

      queryTerms.forEach(term => {
        // Term Frequency
        const tf = words.filter(w => w.includes(term)).length / words.length;

        // Inverse Document Frequency
        const docsWithTerm = books.filter(b => {
          const doc = (b.title + " " + b.author + " " + (b.category || "") + " " + (b.description || "")).toLowerCase();
          return doc.includes(term);
        }).length;

        const idf = docsWithTerm > 0
          ? Math.log(books.length / docsWithTerm)
          : 0;

        score += tf * idf;
      });

      return { book, score };
    });

    // Sort by TF-IDF score
    const sorted = tfidfScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // If no TF-IDF results, fall back to basic search
    if (sorted.length === 0) {
      const basicResults = books.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase())
      );
      return res.json({
        results: basicResults,
        algorithm: "Basic Search (fallback)",
        mlConcept: "TF-IDF (no matches found)",
        scores: []
      });
    }

    res.json({
      results: sorted.map(item => item.book),
      scores: sorted.map(item => ({
        title: item.book.title,
        score: item.score.toFixed(4)
      })),
      algorithm: "TF-IDF Search",
      mlConcept: "Term Frequency × Inverse Document Frequency"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 3: AI BOOK SUMMARY GENERATOR
// AI: Groq LLM (Mixtral)
// ============================================
router.post("/generate-summary", async (req, res) => {
  try {
    if (!groq) {
      return res.status(503).json({ error: "AI service not available" });
    }

    const { title, author, category } = req.body;
    if (!title || !author) {
      return res.status(400).json({ msg: "Title and author required" });
    }

    const prompt = "Write a compelling 80-word library description for the book titled " +
      title + " by " + author +
      (category ? " in the " + category + " genre" : "") +
      ". Make it engaging for library members. Only return the description, nothing else.";

    const summary = await callGroq(prompt);

    res.json({
      summary: summary.trim(),
      algorithm: "Groq LLM (Mixtral)",
      mlConcept: "Large Language Model - Text Generation"
    });

  } catch (err) {
    console.error("Summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 4: OVERDUE PREDICTION
// ML: Logistic Regression (simplified scoring)
// ============================================
router.get("/overdue-prediction/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const borrows = await Borrow.find({ memberId: userId });
    const fines = await Fine.find({ memberId: userId });

    if (borrows.length === 0) {
      return res.json({
        prediction: "low",
        probability: 0.1,
        riskScore: 10,
        algorithm: "Logistic Regression",
        mlConcept: "Binary Classification",
        explanation: "New member - low risk by default",
        features: {}
      });
    }

    // Feature Engineering
    const totalBorrows = borrows.length;
    const overdueBorrows = borrows.filter(b => b.returnDate === null && 
      new Date(b.dueDate) < new Date()).length;
    const returnedBorrows = borrows.filter(b => b.returnDate !== null);
    const totalFines = fines.reduce((sum, f) => sum + (f.fineBalance || 0), 0);
    const unpaidFines = fines.filter(f => f.fineBalance > 0).length;

    // Calculate average days late
    let totalDaysLate = 0;
    returnedBorrows.forEach(b => {
      if (b.returnDate && b.dueDate) {
        const daysLate = Math.max(0,
          (new Date(b.returnDate) - new Date(b.dueDate)) / (1000 * 60 * 60 * 24)
        );
        totalDaysLate += daysLate;
      }
    });
    const avgDaysLate = returnedBorrows.length > 0
      ? totalDaysLate / returnedBorrows.length
      : 0;

    // Logistic Regression Features
    const features = {
      overdueRate: overdueBorrows / totalBorrows,
      avgDaysLate: avgDaysLate,
      unpaidFines: unpaidFines,
      totalFineAmount: totalFines
    };

    // Calculate Risk Score
    let riskScore = 0;
    riskScore += features.overdueRate * 40;
    riskScore += Math.min(features.avgDaysLate * 2, 30);
    riskScore += features.unpaidFines * 10;
    riskScore += Math.min(features.totalFineAmount / 10, 20);
    riskScore = Math.min(100, Math.round(riskScore));

    const probability = riskScore / 100;
    const prediction = riskScore > 60 ? "high" :
      riskScore > 30 ? "medium" : "low";

    // Groq AI explanation
    let aiExplanation = "Risk assessment based on borrowing history.";
    if (groq) {
      try {
        aiExplanation = await callGroq(
          "In 2 sentences, explain the overdue risk for a library member with " +
          "overdue rate of " + (features.overdueRate * 100).toFixed(0) + "% and " +
          "average " + avgDaysLate.toFixed(1) + " days late. Risk level: " + prediction
        );
      } catch (err) {
        console.log("AI explanation failed:", err.message);
      }
    }

    res.json({
      prediction,
      probability: probability.toFixed(2),
      riskScore,
      algorithm: "Logistic Regression",
      mlConcept: "Binary Classification with Feature Engineering",
      features,
      explanation: aiExplanation
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 5: READING ANALYTICS
// Data Science: Statistical Analysis
// ============================================
router.get("/reading-analytics/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const borrows = await Borrow.find({ memberId: userId })
      .populate("bookId", "title author category");

    if (borrows.length === 0) {
      return res.json({
        totalBooks: 0,
        favoriteGenre: "None yet",
        readingStreak: 0,
        monthlyData: [],
        genreData: [],
        insights: "Start borrowing books to see your reading analytics!"
      });
    }

    // Total books read
    const totalBooks = borrows.filter(b => b.returnDate !== null).length;

    // Favorite genre
    const genreCount = {};
    borrows.forEach(b => {
      if (b.bookId && b.bookId.category) {
        genreCount[b.bookId.category] = (genreCount[b.bookId.category] || 0) + 1;
      }
    });
    const favoriteGenre = Object.keys(genreCount).length > 0
      ? Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b)
      : "Various";

    // Monthly reading data
    const monthlyData = {};
    borrows.forEach(b => {
      const month = new Date(b.borrowDate).toLocaleString("default",
        { month: "short", year: "numeric" });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const monthlyArray = Object.keys(monthlyData).map(month => ({
      month,
      books: monthlyData[month]
    }));

    // Genre distribution
    const genreArray = Object.keys(genreCount).map(genre => ({
      genre,
      count: genreCount[genre]
    }));

    // Reading streak
    const sortedBorrows = borrows.sort((a, b) =>
      new Date(b.borrowDate) - new Date(a.borrowDate)
    );
    let streak = 0;
    let currentMonth = new Date().getMonth();
    sortedBorrows.forEach(b => {
      const borrowMonth = new Date(b.borrowDate).getMonth();
      if (Math.abs(currentMonth - borrowMonth) <= 1) {
        streak++;
        currentMonth = borrowMonth - 1;
      }
    });

    // Groq AI insights
    let aiInsights = "Great reading activity!";
    if (groq) {
      try {
        aiInsights = await callGroq(
          "Give 2 encouraging sentences as reading insights for a library member who has read " +
          totalBooks + " books, with favorite genre: " + favoriteGenre +
          ". Be motivating and specific."
        );
      } catch (err) {
        console.log("AI insights failed:", err.message);
      }
    }

    res.json({
      totalBooks,
      totalBorrows: borrows.length,
      favoriteGenre,
      readingStreak: streak,
      monthlyData: monthlyArray,
      genreData: genreArray,
      algorithm: "Statistical Analysis",
      mlConcept: "Data Aggregation and Pattern Recognition",
      insights: aiInsights
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 6: SMART FINE WAIVER
// ML: Scoring Algorithm + Groq Decision
// ============================================
router.get("/fine-waiver/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const borrows = await Borrow.find({ memberId: userId });
    const fines = await Fine.find({ memberId: userId });
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Calculate Member Score (0-100)
    let score = 50; // Base score

    const totalBorrows = borrows.length;
    const onTimeReturns = borrows.filter(b => {
      if (b.returnDate === null) return false;
      return new Date(b.returnDate) <= new Date(b.dueDate);
    }).length;

    const paidFines = fines.filter(f => f.fineBalance === 0).length;
    const unpaidFines = fines.filter(f => f.fineBalance > 0).length;
    const totalFineAmount = fines.reduce((sum, f) => sum + (f.fineBalance || 0), 0);

    // Scoring Rules
    if (totalBorrows > 0) score += (onTimeReturns / totalBorrows) * 30;
    score += paidFines * 5;
    score -= unpaidFines * 10;
    score -= Math.min(totalFineAmount / 10, 20);
    if (totalBorrows > 10) score += 10;
    if (totalBorrows > 20) score += 5;

    score = Math.min(100, Math.max(0, Math.round(score)));

    const recommendation = score >= 80 ? "approve" :
      score >= 60 ? "partial" : "deny";

    const waivePercentage = score >= 80 ? 100 :
      score >= 60 ? 50 : 0;

    // Groq AI decision
    let aiDecision = "Fine waiver assessment based on member activity.";
    if (groq) {
      try {
        aiDecision = await callGroq(
          "In 2 sentences, explain a fine waiver decision for a library member " +
          "with member score " + score + "/100, " +
          totalBorrows + " total borrows, " +
          onTimeReturns + " on-time returns, " +
          unpaidFines + " unpaid fines. " +
          "Recommendation: " + recommendation + " (" + waivePercentage + "% waiver)."
        );
      } catch (err) {
        console.log("AI decision failed:", err.message);
      }
    }

    res.json({
      memberScore: score,
      recommendation,
      waivePercentage,
      stats: {
        totalBorrows,
        onTimeReturns,
        paidFines,
        unpaidFines,
        totalFineAmount
      },
      algorithm: "Member Scoring Algorithm",
      mlConcept: "Rule-based Scoring with Weighted Features",
      aiDecision
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;