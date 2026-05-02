import express from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { uploadToCloudinary } from '../lib/cloudinary';
import { seedAdmin } from "../lib/seed";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register & Signup Alias
router.post(["/register", "/signup"], async (req, res) => {
  try {
    await seedAdmin(); // Ensure admin exists if DB was cleared
    const { fullName, email, phoneNumber, password, role, ninImage, shopImage, landmark } = req.body;
    console.log(`[Auth] Registration Details: email=${email}, role=${role}, landmark=${landmark || req.body.landmark || 'NONE'}`);
    console.log(`[Auth] Full Body Keys: ${Object.keys(req.body).join(', ')}`);

    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or phone already exists" });
    }

    // Handle Image Uploads to Cloudinary
    let ninUrl = ninImage;
    if (ninImage && ninImage.startsWith('data:image')) {
      ninUrl = await uploadToCloudinary(ninImage, 'riders');
    }

    let shopUrl = shopImage;
    if (shopImage && shopImage.startsWith('data:image')) {
      shopUrl = await uploadToCloudinary(shopImage, 'vendors');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a unique transfer reference
    const transferReference = `QW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const user = await User.create({
      ...req.body,
      uid: uuidv4(),
      password: hashedPassword,
      transferReference,
      landmark: landmark || req.body.landmark || 'Under-G',
      role: role || 'customer',
      isApproved: (role === 'vendor' || role === 'rider') ? false : true,
      trustPoints: 100,
      trustScore: 100,
      status: 'active',
      ninImage: ninUrl,
      shopImage: shopUrl
    });

    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ user: userData, token });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// (Route removed as it's now handled by the multi-path register route)

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
    console.log("[Auth] Starting login process...");
    await seedAdmin(); // Ensure admin exists if DB was cleared
    
    const identifier = req.body.identifier?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    console.log(`[Auth] Login attempt for: ${identifier}`);

    // Super Admin Hardcoded Bypass (Absolute Priority)
    const superAdminEmail = "ogunwedebo21@gmail.com";
    const superAdminPass = "ogunwedebo21";
    const extraSuperAdminId = "super-admin";
    const superAdminPhone = "07048865686";

    if ((identifier === superAdminEmail || identifier === extraSuperAdminId || identifier === superAdminPhone) && password === superAdminPass) {
      console.log(`[Auth-Emergency] Super Admin HARDCODED bypass triggered for: ${identifier}`);
      
      let adminUser = await User.findOne({ 
        $or: [
          { email: superAdminEmail },
          { phoneNumber: superAdminPhone }
        ]
      });
      
      if (!adminUser) {
        console.log("[Auth-Emergency] Super Admin not found in DB, creating on-the-fly...");
        const hashedPassword = await bcrypt.hash(superAdminPass, 10);
        adminUser = await User.create({
          uid: "admin-root-001",
          fullName: "Quick-Wash Admin",
          email: superAdminEmail,
          phoneNumber: "09012345678",
          password: hashedPassword,
          role: "super-admin",
          isApproved: true,
          status: "active",
          trustPoints: 100,
          trustScore: 100,
          walletBalance: 0,
          pendingBalance: 0
        });
      }

      const token = jwt.sign({ uid: adminUser.uid, role: adminUser.role, email: adminUser.email }, JWT_SECRET, { expiresIn: '7d' });
      const userData = adminUser.toObject();
      delete userData.password;
      console.log("[Auth-Emergency] Super Admin bypass SUCCESS");
      return res.json({ user: userData, token });
    }

    const user = await User.findOne({ 
      $or: [{ phoneNumber: identifier }, { email: identifier }] 
    });

    if (!user) {
      console.log(`[Auth] User not found: ${identifier}`);
      return res.status(401).json({ message: 'User not found. Please register or check your details.' });
    }

    console.log(`[Auth] Found user: ${user.email} (Role: ${user.role})`);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[Auth] Password match result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const userData = user.toObject();
    delete userData.password;

    console.log(`[Auth] Login successful for: ${user.email}`);
    res.json({ user: userData, token });
  } catch (err: any) {
    console.error("[Auth] Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all vendors
router.get("/get-all-vendors", async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select("-password");
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
    res.json(user.toObject());
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

// Get Current User (from token)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await User.findOne({ uid: decoded.uid }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user.toObject());
  } catch (err: any) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Adjust Trust Points (Backend Controlled)
router.post("/trust/adjust/:uid", async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    let change = 0;
    let isPenalty = false;

    switch (action) {
      case 'completed_order': change = 5; break;
      case 'five_star_review': change = 8; break;
      case 'admin_good_performance': change = 10; break;
      case 'cancel_after_ready': change = -10; isPenalty = true; break;
      case 'customer_not_available': change = -8; isPenalty = true; break;
      case 'late_delivery': change = -10; isPenalty = true; break;
      case 'rider_abandon': change = -15; isPenalty = true; break;
      case 'vendor_delay': change = -12; isPenalty = true; break;
      case 'fake_dispute': change = -20; isPenalty = true; break;
      case 'rider_return_order': change = -5; isPenalty = true; break;
      case 'repeated_cancellation': 
        change = -25; 
        isPenalty = true;
        const banExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        user.status = 'restricted';
        user.restrictionExpires = banExpiry;
        break;
    }

    user.trustPoints = (user.trustPoints || 0) + change;
    if (isPenalty) user.lastPenaltyAt = new Date();
    
    await user.save();
    res.json(user.toObject());
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Auto Recovery Process
router.post("/trust/auto-recovery/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.trustPoints >= 100) return res.json(user.toObject());

    const now = Date.now();
    const lastPenalty = user.lastPenaltyAt ? new Date(user.lastPenaltyAt).getTime() : 0;
    const lastRecovery = user.lastRecoveryAt ? new Date(user.lastRecoveryAt).getTime() : 0;
    
    const daysSincePenalty = (now - lastPenalty) / (24 * 60 * 60 * 1000);
    const daysSinceRecovery = (now - lastRecovery) / (24 * 60 * 60 * 1000);

    if (daysSincePenalty >= 27 && daysSinceRecovery >= 27) {
      user.trustPoints = Math.min(100, (user.trustPoints || 0) + 10);
      user.lastRecoveryAt = new Date();
      await user.save();
    }
    
    res.json(user.toObject());
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.patch("/:uid", async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle specific image uploads if present
    if (updateData.shopImage && updateData.shopImage.startsWith('data:image')) {
      updateData.shopImage = await uploadToCloudinary(updateData.shopImage, 'vendors');
    }
    if (updateData.ninImage && updateData.ninImage.startsWith('data:image')) {
      updateData.ninImage = await uploadToCloudinary(updateData.ninImage, 'riders');
    }

    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: updateData },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
