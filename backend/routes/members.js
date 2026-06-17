const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Get all members only (not librarians)
router.get("/", async (req, res) => {
  try {
    const members = await User.find({ role: "member" }).select("-password");
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single member
router.get("/:id", async (req, res) => {
  try {
    const member = await User.findById(req.params.id).select("-password");
    if (!member) return res.status(404).json({ msg: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update member
router.put("/:id", async (req, res) => {
  try {
    const member = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete member
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "Member deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
