import express from "express";
import Transaction from "../models/Transaction";
import User from "../models/User";

const router = express.Router();

router.get("/transactions/:userId", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/deposit", async (req, res) => {
  try {
    const { userId, amount, desc } = req.body;
    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance += Number(amount);
    await user.save();

    const transaction = await Transaction.create({
      userId,
      amount,
      type: 'deposit',
      status: 'completed',
      desc: desc || 'Wallet Deposit'
    });

    res.json({ balance: user.walletBalance, transaction });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
