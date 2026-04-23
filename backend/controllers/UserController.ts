import { Request, Response } from 'express';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'quick_wash_secret_99';

export const signup = async (req: Request, res: Response) => {
  try {
    const { 
      fullName, phoneNumber, email, password, role, 
      shopName, shopAddress, vehicleType, nin,
      shopImage, ninImage 
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ $or: [{ phoneNumber }, { email: normalizedEmail }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = Math.random().toString(36).substring(2, 15);
    const transferReference = `QW-${Math.floor(100000 + Math.random() * 900000)}`;

    const newUser = new User({
      uid, fullName, phoneNumber, email: normalizedEmail, password: hashedPassword,
      role, shopName, shopAddress, vehicleType, nin,
      shopImage, ninImage, transferReference,
      isApproved: role === 'customer',
      status: 'active',
      walletBalance: 0,
      pendingBalance: 0,
      trustPoints: 100,
      trustScore: 100
    });

    await newUser.save();
    const token = jwt.sign({ uid: newUser.uid, role: newUser.role, email: newUser.email }, JWT_SECRET);
    
    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({ user: userObj, token });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phoneOrEmail, password } = req.body;
    
    // 1. Basic validation to prevent "Illegal arguments: string, undefined"
    if (!password) {
      console.log('❌ Login failed: Missing password in request');
      return res.status(400).json({ message: "Password is required" });
    }

    if (!phoneOrEmail) {
      console.log('❌ Login failed: Missing phoneOrEmail identifier');
      return res.status(400).json({ message: "Phone number or Email is required" });
    }

    // Normalize email if provided
    const identifier = typeof phoneOrEmail === 'string' ? phoneOrEmail.toLowerCase().trim() : phoneOrEmail;

    // 2. Use .select('+password') in case the field is hidden in the schema
    const user = await User.findOne({ 
      $or: [
        { phoneNumber: phoneOrEmail }, 
        { email: identifier },
        { email: phoneOrEmail }
      ] 
    }).select('+password');

    if (!user) {
      console.log(`❌ Login failed: User not found for "${phoneOrEmail}"`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Bcrypt comparison
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      console.log(`❌ Login failed: Password mismatch for user "${user.email || user.phoneNumber}"`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 4. Generate Token (Includes role and email for checkRole middleware)
    const token = jwt.sign(
      { uid: user.uid, role: user.role, email: user.email }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    console.log(`✅ Login successful: ${user.fullName} (${user.role})`);
    res.json({ user: userObj, token });
  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req: any, res: Response) => {
  res.json(req.user);
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const updates = req.body;
    const user = await User.findOneAndUpdate({ uid: req.user.uid }, updates, { new: true });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { isApproved } = req.body;
    const user = await User.findOneAndUpdate({ uid }, { isApproved }, { new: true });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await User.findOneAndDelete({ uid: req.params.uid });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const processRecovery = async (req: any, res: Response) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.trustPoints = 100;
    user.status = 'active';
    user.lastRecoveryAt = new Date();
    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustTrust = async (req: any, res: Response) => {
  try {
    const { action } = req.body;
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const deltas: any = {
      completed_order: 2,
      five_star_review: 5,
      admin_good_performance: 10,
      cancel_after_ready: -15,
      customer_not_available: -5,
      late_delivery: -10,
      rider_abandon: -30,
      vendor_delay: -10,
      fake_dispute: -50,
      repeated_cancellation: -20,
      rider_return_order: -5
    };
    
    const delta = deltas[action] || 0;
    user.trustPoints = Math.max(0, Math.min(100, (user.trustPoints || 100) + delta));
    
    if (user.trustPoints < 30) user.status = 'suspended';
    else if (user.trustPoints < 60) user.status = 'restricted';
    else user.status = 'active';

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const autoRecoverTrust = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const lastPenalty = user.lastPenaltyAt ? new Date(user.lastPenaltyAt).getTime() : 0;
    const lastRecovery = user.lastRecoveryAt ? new Date(user.lastRecoveryAt).getTime() : 0;

    const daysSincePenalty = (now.getTime() - lastPenalty) / (24 * 60 * 60 * 1000);
    const daysSinceRecovery = (now.getTime() - lastRecovery) / (24 * 60 * 60 * 1000);

    // Sync: Must be 27 days clean for +10 recovery
    if (daysSincePenalty >= 27 && daysSinceRecovery >= 27 && user.trustPoints < 100) {
      user.trustPoints = Math.min(100, user.trustPoints + 10);
      user.lastRecoveryAt = now;
      await user.save();
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const recordTransaction = async (req: AuthRequest, res: Response) => {
  const { uid } = req.params;
  const { amount, type, desc, purpose, reference } = req.body;

  try {
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = new Wallet({ user: user._id, balance: 0, transactions: [] });
    }

    if (type === "credit" || type === "deposit") {
      wallet.balance += amount;
    } else if (type === "debit" || type === "withdrawal") {
      wallet.balance -= amount;
    }

    wallet.transactions.push({
      amount,
      type,
      purpose: purpose || desc,
      reference: reference || `TRX-${Date.now()}`,
      date: new Date(),
    });

    await wallet.save();

    user.walletBalance = wallet.balance;
    await user.save();

    res.json({ message: "Transaction recorded", balance: wallet.balance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserByUid = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const updates = req.body;

    // Strict 11-digit numeric validation for NIN and Phone
    const digitRegex = /^\d{11}$/;

    if (updates.nin && !digitRegex.test(updates.nin)) {
      return res.status(400).json({
        message: "NIN must be exactly 11 digits and contain only numbers"
      });
    }

    if (updates.phoneNumber && !digitRegex.test(updates.phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be exactly 11 digits and contain only numbers"
      });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
