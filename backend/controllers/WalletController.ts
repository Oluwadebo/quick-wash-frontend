import { Request, Response } from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

export const getHistory = async (req: any, res: Response) => {
  try {
    const { uid } = req.query;
    const decoded = req.user;

    if (uid !== decoded.uid && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const transactions = await Transaction.find({ uid }).sort({ createdAt: -1 });
    const user = await User.findOne({ uid });

    res.json({
      transactions,
      balance: user?.walletBalance || 0,
      pending: user?.pendingBalance || 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deposit = async (req: any, res: Response) => {
  try {
    const { amount, desc } = req.body;
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.walletBalance += amount;
    await user.save();

    const transaction = await Transaction.create({
      uid: user.uid,
      type: 'deposit',
      amount,
      desc: desc || 'Wallet funding',
      status: 'completed'
    });

    res.json({ balance: user.walletBalance, transaction });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const withdraw = async (req: any, res: Response) => {
  try {
    const { amount } = req.body;
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.walletBalance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    user.walletBalance -= amount;
    user.withdrawalRequested = true;
    await user.save();

    const transaction = await Transaction.create({
      uid: user.uid,
      type: 'withdrawal',
      amount,
      desc: 'Wallet withdrawal request',
      status: 'pending'
    });

    res.json({ balance: user.walletBalance, transaction });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { uid, type, amount, desc, status } = req.body;
    const transaction = await Transaction.create({ uid, type, amount, desc, status: status || 'completed' });
    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
