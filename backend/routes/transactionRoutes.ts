import express from "express";
import Transaction from "../models/Transaction";
import User from "../models/User";

const router = express.Router();

// Record Transaction (this is what DatabaseService calls)
router.post("/", async (req, res) => {
  try {
    const { userId, type, amount, desc, method, reference, status } = req.body;
    
    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update balance
    const numAmount = Number(amount) || 0;
    if (type === 'deposit' || type === 'refund' || type === 'payout' || type === 'commission') {
      user.walletBalance = (Number(user.walletBalance) || 0) + numAmount;
    } else if (type === 'withdrawal' || type === 'payment') {
      user.walletBalance = (Number(user.walletBalance) || 0) - numAmount;
    }
    await user.save();

    const transaction = await Transaction.create({
      userId,
      type,
      amount: numAmount,
      desc,
      method,
      reference,
      status: status || 'completed',
      date: new Date()
    });

    res.json({ balance: user.walletBalance, transaction });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get History
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
