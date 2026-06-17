const express = require("express");
const Fine = require("../models/Fine");
const User = require("../models/User");
const router = express.Router();

// Librarian creates fine manually
router.post("/", async (req, res) => {
  try {
    console.log("Create fine request:", req.body);
    const { memberId, amount, reason } = req.body;

    if (!memberId || !amount) {
      return res.status(400).json({ msg: "Member and amount required" });
    }

    const fine = new Fine({
      memberId: memberId,
      borrowId: null,
      amount: Number(amount),
      reason: reason || "Manual fine by librarian"
    });

    await fine.save();

    await User.findByIdAndUpdate(memberId, {
      $inc: { fineBalance: Number(amount) }
    });

    console.log("Fine created:", fine._id);
    res.status(201).json({ msg: "Fine added successfully!", fine });
  } catch (err) {
    console.error("Create fine error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get fines for a member
router.get("/my/:memberId", async (req, res) => {
  try {
    const fines = await Fine.find({ memberId: req.params.memberId })
      .sort({ createdAt: -1 });
    res.json(fines);
  } catch (err) {
    console.error("Get my fines error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Pay fine
router.put("/pay/:fineId", async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.fineId);
    if (!fine) return res.status(404).json({ msg: "Fine not found" });
    if (fine.status === "paid") return res.status(400).json({ msg: "Fine already paid" });

    fine.status = "paid";
    await fine.save();

    await User.findByIdAndUpdate(fine.memberId, {
      $inc: { fineBalance: -fine.amount }
    });

    res.json({ msg: "Fine paid successfully!", fine });
  } catch (err) {
    console.error("Pay fine error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all fines (librarian)
router.get("/all", async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate("memberId", "name email")
      .sort({ createdAt: -1 });
    res.json(fines);
  } catch (err) {
    console.error("Get all fines error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
