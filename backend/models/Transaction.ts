import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
 userId: string;
  type: 'deposit' | 'withdrawal' | 'refund' | 'payout' | 'commission' | 'payment';
  amount: number;
  desc: string;
  method?: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed' | 'disputed';
  issueDescription?: string;
  reference?: string;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'refund', 'payout', 'commission', 'payment'], required: true, index: true },
  amount: { type: Number, required: true },
  desc: { type: String, required: true },
  method: { type: String },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['completed', 'pending', 'failed', 'disputed'], default: 'completed' },
  issueDescription: { type: String },
  reference: { type: String },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
