import mongoose, { Schema, Document } from 'mongoose';

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'payout', 'commission'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  desc: { type: String },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
