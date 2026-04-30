import express from "express";
import Transaction from "../models/Transaction";
import User from "../models/User";

const router = express.Router();

// Get balance and history
router.get("/history", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    const user = await User.findOne({ uid: userId });
    
    console.log(`[Wallet] Fetched ${transactions.length} transactions for user ${userId}. Balance: ₦${user?.walletBalance || 0}`);

    res.json({
      transactions,
      balance: user?.walletBalance || 0
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy support or internal use
router.get("/transactions/:userId", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/fund", async (req, res) => {
  try {
    const { amount, method, reference, userId: bodyUserId } = req.body;
    // Note: in a real app, userId should come from token. For now we might need it in body if not using auth middleware
    const userId = bodyUserId || req.query.userId; 

    console.log(`[Wallet] Funding request for user: ${userId}, amount: ${amount}, method: ${method}`);

    if (!userId) {
      console.error("[Wallet] Missing userId in fund request");
      return res.status(400).json({ message: "userId required" });
    }

    const user = await User.findOne({ uid: userId });
    if (!user) {
      console.error(`[Wallet] User NOT found for funding: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Update balance
    user.walletBalance = (Number(user.walletBalance) || 0) + numAmount;
    await user.save();
    console.log(`[Wallet] New balance for ${userId}: ₦${user.walletBalance}`);

    const transaction = await Transaction.create({
      userId,
      amount: numAmount,
      type: 'deposit',
      status: 'completed',
      method: method || 'External',
      reference: reference || `REF-${Date.now()}`,
      desc: `Wallet Funding via ${method || 'External'}`,
      date: new Date()
    });
    console.log(`[Wallet] Transaction created for ${userId}: ${transaction._id}`);

    res.json({ 
      balance: user.walletBalance, 
      transaction,
      message: `Successfully funded ₦${numAmount}`
    });
  } catch (err: any) {
    console.error('[Wallet] Funding error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Legacy deposit route
router.post("/deposit", async (req, res) => {
  try {
    const { userId, amount, desc } = req.body;
    const user = await User.findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletBalance = (Number(user.walletBalance) || 0) + Number(amount);
    await user.save();

    const transaction = await Transaction.create({
      userId,
      amount,
      type: 'deposit',
      status: 'completed',
      desc: desc || 'Wallet Deposit',
      date: new Date()
    });

    res.json({ balance: user.walletBalance, transaction });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
