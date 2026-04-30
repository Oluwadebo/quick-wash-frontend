import express from "express";
import AdminInvite from "../models/AdminInvite";
import User from "../models/User";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, role, fullName } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const invite = await AdminInvite.create({
      email,
      fullName,
      role: role || 'admin',
      token,
      expiresAt: expires,
      isUsed: false
    });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const inviteLink = `${frontendUrl}/auth/admin-finish?token=${token}`;

    res.json({ message: "Invite created", token, inviteLink });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Verify invite (via query param)
router.get("/verify", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const invite = await AdminInvite.findOne({ 
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    if (!invite) return res.status(404).json({ message: "Invalid or expired invite" });
    res.json(invite);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Verify invite (via path param - legacy support)
router.get("/verify/:token", async (req, res) => {
  try {
    const invite = await AdminInvite.findOne({ 
      token: req.params.token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    if (!invite) return res.status(404).json({ message: "Invalid or expired invite" });
    res.json(invite);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Complete invite registration
router.post("/complete", async (req, res) => {
  try {
    const { token, fullName, email, phoneNumber, password, role } = req.body;
    
    // 1. Verify invite
    const invite = await AdminInvite.findOne({ token, isUsed: false });
    if (!invite) return res.status(400).json({ message: "Invalid or used invite" });

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: "Invite has expired" });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) return res.status(400).json({ message: "A user with this email or phone already exists" });

    // 3. Create admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      uid: uuidv4(),
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || invite.role,
      isApproved: true,
      status: 'active',
      trustPoints: 100,
      trustScore: 100,
      walletBalance: 0,
      pendingBalance: 0
    });

    // 4. Mark invite as used
    invite.isUsed = true;
    await invite.save();

    // 5. Generate token for auto-login
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const jwtToken = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ 
      message: "Admin registered successfully", 
      user: userData, 
      token: jwtToken 
    });
  } catch (err: any) {
    console.error("[Invite-Complete] Error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
