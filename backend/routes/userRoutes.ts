import express from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or phone already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      uid: uuidv4(),
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || 'customer',
      isApproved: role === 'vendor' || role === 'rider' ? false : true,
      trustPoints: 100,
      trustScore: 100,
      status: 'active'
    });

    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ user: userData, token });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Create User
router.post("/create", async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role, isApproved } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    const user = await User.create({
      uid: uuidv4(),
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || 'customer',
      isApproved: isApproved !== undefined ? isApproved : true,
      trustPoints: 100,
      trustScore: 100,
      status: 'active'
    });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // In real app, send email
    res.json({ message: "Reset token generated", token: resetToken });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    res.json({ message: "Password reset successful" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({ 
      $or: [{ phoneNumber: identifier }, { email: identifier }] 
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found. Please register or check your details.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const userData = user.toObject();
    delete userData.password;

    res.json({ user: userData, token });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get all vendors
router.get("/get-all-vendors", async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor', isApproved: true }).select("-password");
    res.json(vendors);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get single user
router.get("/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Approve User
router.post("/approve/:uid", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { isApproved: true },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Stats
router.get("/stats/overview", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    // In a real app, you'd aggregate orders etc.
    res.json({ totalUsers: userCount });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.patch("/:uid", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: req.body },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
