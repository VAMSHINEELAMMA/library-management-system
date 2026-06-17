const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ msg: "Auth route working!" });
});

router.post("/register", async (req, res) => {
  console.log("Register request:", req.body);
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email and password are required" });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const allowedRoles = ["member", "librarian", "admin"];
    const userRole = allowedRoles.includes(role) ? role : "member";
    user = new User({
      name, email, password,
      phone: phone || "",
      address: address || "",
      role: userRole
    });
    await user.save();
    console.log("User saved:", user.email, "Role:", user.role);
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  console.log("Login request:", req.body);
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const loginTime = new Date();

    // Use updateOne to avoid triggering pre-save hook
    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: loginTime },
        $push: { loginHistory: { loginTime: loginTime } }
      }
    );

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Login successful:", user.email);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;
    const logoutTime = new Date();

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          lastLogout: logoutTime,
          "loginHistory.$[last].logoutTime": logoutTime
        }
      },
      {
        arrayFilters: [{ "last.logoutTime": { $exists: false } }]
      }
    );

    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
