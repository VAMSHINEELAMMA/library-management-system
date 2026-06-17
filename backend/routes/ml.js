const express = require("express");
const Groq = require("groq-sdk");
const Borrow = require("../models/Borrow");
const Book = require("../models/Book");
const User = require("../models/User");
const Fine = require("../models/Fine");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================
// HELPER: Call Groq AI
// ============================================
const callGroq = async (prompt) => {
  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    max_tokens: 500
  });
  return response.choices[0].message.content;
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

    const userBookMatrix = {};
    allBorrows.forEach(borrow => {
      if (!borrow.memberId || !borrow.bookId) return;
      const uid = borrow.memberId._id.toString();
      const bid = borrow.bookId._id.toString();
      if (!userBookMatrix[uid]) userBookMatrix[uid] = {};
      userBookMatrix[uid][bid] = 1;
    });

    const currentUserBooks = userBookMatrix[userId] || {};
    const currentUserBookIds = Object.keys(currentUserBooks);

    const allBooks = await Book.find({
      _id: { $nin: currentUserBookIds }
    });

    if (currentUserBookIds.length === 0) {
      const popular = await Borrow.aggregate([
        { $group: { _id: "$bookId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]);
      const popularBooks = await Book.find({
        _id: { $in: popular.map(p => p._id) }
      });
      const books = popularBooks.length > 0 ? popularBooks : allBooks.slice(0, 6);
      return res.json({
        recommendations: books,
        algorithm: "Popular Books",
        mlConcept: "Popularity-Based Filtering",
        explanation: "Since you are new we recommend the most borrowed books!"
      });
    }

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

    const similarities = [];
    Object.keys(userBookMatrix).forEach(otherUserId => {
      if (otherUserId === userId) return;
      const similarity = cosineSimilarity(
        currentUserBooks,
        userBookMatrix[otherUserId]
      );
      similarities.push({ userId: otherUserId, similarity });
    });

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarUsers = similarities.slice(0, 3);

    const recommendedBookIds = new Set();
    topSimilarUsers.forEach(({ userId: simUserId }) => {
      if (userBookMatrix[simUserId]) {
        Object.keys(userBookMatrix[simUserId]).forEach(bookId => {
          if (!currentUserBooks[bookId]) recommendedBookIds.add(bookId);
        });
      }
    });

    let recommendedBooks = [];
    if (recommendedBookIds.size > 0) {
      recommendedBooks = await Book.find({
        _id: { $in: Array.from(recommendedBookIds) }
      });
    }

    if (recommendedBooks.length < 6) {
      const existingIds = recommendedBooks.map(b => b._id.toString());
      const fillBooks = allBooks.filter(b =>
        !existingIds.includes(b._id.toString())
      ).slice(0, 6 - recommendedBooks.length);
      recommendedBooks = [...recommendedBooks, ...fillBooks];
    }

    const aiExplanation = await callGroq(
      "In 2 sentences explain why a library member who read " +
      currentUserBookIds.length +
      " books would enjoy similar books based on collaborative filtering."
    );

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
    const query = req.query.q || "";
    if (!query) return res.json({ results: [], scores: [] });

    const books = await Book.find();
    const queryTerms = query.toLowerCase().split(" ");

    const tfidfScores = books.map(book => {
      const document = (
        book.title + " " +
        book.author + " " +
        book.category + " " +
        book.description
      ).toLowerCase();

      const words = document.split(" ");
      let score = 0;

      queryTerms.forEach(term => {
        const tf = words.filter(w => w.includes(term)).length / words.length;
        const docsWithTerm = books.filter(b => {
          const doc = (
            b.title + " " + b.author + " " +
            b.category + " " + b.description
          ).toLowerCase();
          return doc.includes(term);
        }).length;
        const idf = docsWithTerm > 0
          ? Math.log(books.length / docsWithTerm)
          : 0;
        score += tf * idf;
      });

      return { book, score };
    });

    const sorted = tfidfScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (sorted.length === 0) {
      const basicResults = books.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.category.toLowerCase().includes(query.toLowerCase()) ||
        book.description.toLowerCase().includes(query.toLowerCase())
      );
      return res.json({
        results: basicResults,
        algorithm: "Basic Search",
        mlConcept: "TF-IDF fallback to keyword search",
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
      mlConcept: "Term Frequency x Inverse Document Frequency"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 3: AI BOOK SUMMARY GENERATOR
// AI: Groq LLM (Llama 3)
// ============================================
router.post("/generate-summary", async (req, res) => {
  try {
    const { title, author, category } = req.body;
    if (!title || !author) {
      return res.status(400).json({ msg: "Title and author required" });
    }

    const prompt = "Write a compelling 80-word library description for the book titled " +
      title + " by " + author +
      (category ? " in the " + category + " genre" : "") +
      ". Make it engaging for library members. Only return the description nothing else.";

    const summary = await callGroq(prompt);

    res.json({
      summary: summary.trim(),
      algorithm: "Groq LLM",
      mlConcept: "Large Language Model - Text Generation"
    });

  } catch (err) {
    console.error("Summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEATURE 4: OVERDUE PREDICTION
// ML: Logistic Regression scoring
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

    const totalBorrows = borrows.length;
    const overdueBorrows = borrows.filter(b => b.status === "overdue").length;
    const returnedBorrows = borrows.filter(b => b.status === "returned");
    const totalFines = fines.reduce((sum, f) => sum + f.amount, 0);
    const unpaidFines = fines.filter(f => f.status === "pending").length;

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
      ? totalDaysLate / returnedBorrows.length : 0;

    const features = {
      overdueRate: overdueBorrows / totalBorrows,
      avgDaysLate,
      unpaidFines,
      totalFineAmount: totalFines
    };

    let riskScore = 0;
    riskScore += features.overdueRate * 40;
    riskScore += Math.min(features.avgDaysLate * 2, 30);
    riskScore += features.unpaidFines * 10;
    riskScore += Math.min(features.totalFineAmount / 10, 20);
    riskScore = Math.min(100, Math.round(riskScore));

    const probability = riskScore / 100;
    const prediction = riskScore > 60 ? "high" :
      riskScore > 30 ? "medium" : "low";

    const aiExplanation = await callGroq(
      "In 2 sentences explain the overdue risk for a library member with " +
      "overdue rate of " + (features.overdueRate * 100).toFixed(0) + "% and " +
      "average " + avgDaysLate.toFixed(1) + " days late. Risk level: " + prediction
    );

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

    const totalBooks = borrows.filter(b => b.status === "returned").length;

    const genreCount = {};
    borrows.forEach(b => {
      if (b.bookId && b.bookId.category) {
        genreCount[b.bookId.category] = (genreCount[b.bookId.category] || 0) + 1;
      }
    });

    const favoriteGenre = Object.keys(genreCount).length > 0
      ? Object.keys(genreCount).reduce((a, b) =>
          genreCount[a] > genreCount[b] ? a : b)
      : "Various";

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

    const genreArray = Object.keys(genreCount).map(genre => ({
      genre,
      count: genreCount[genre]
    }));

    const aiInsights = await callGroq(
      "Give 2 encouraging sentences as reading insights for a library member who has read " +
      totalBooks + " books with favorite genre: " + favoriteGenre +
      ". Be motivating and specific."
    );

    res.json({
      totalBooks,
      totalBorrows: borrows.length,
      favoriteGenre,
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

    let score = 50;
    const totalBorrows = borrows.length;
    const onTimeReturns = borrows.filter(b => {
      if (b.status !== "returned" || !b.returnDate) return false;
      return new Date(b.returnDate) <= new Date(b.dueDate);
    }).length;

    const paidFines = fines.filter(f => f.status === "paid").length;
    const unpaidFines = fines.filter(f => f.status === "pending").length;
    const totalFineAmount = fines.reduce((sum, f) => sum + f.amount, 0);

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

    const aiDecision = await callGroq(
      "In 2 sentences explain a fine waiver decision for a library member " +
      "with member score " + score + "/100, " +
      totalBorrows + " total borrows, " +
      onTimeReturns + " on-time returns, " +
      unpaidFines + " unpaid fines. " +
      "Recommendation: " + recommendation + " (" + waivePercentage + "% waiver)."
    );

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