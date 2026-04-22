import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  id: string;
  uid: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: number;
  desc: string;
  status: 'pending' | 'completed' | 'failed';
  date: Date;
}

const TransactionSchema: Schema = new Schema({
  id: { type: String, default: () => Math.random().toString(36).substr(2, 9) },
  uid: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'payment'], required: true },
  amount: { type: Number, required: true },
  desc: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
