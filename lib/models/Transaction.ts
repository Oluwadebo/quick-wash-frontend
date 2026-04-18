import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uid: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'payment', 'refund', 'earning'], required: true },
  amount: { type: Number, required: true },
  desc: { type: String, required: true },
  date: { type: Date, default: Date.now },
  time: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'pending', 'failed', 'disputed'], default: 'success' },
  disputeReason: { type: String }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
