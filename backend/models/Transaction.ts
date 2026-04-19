import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  id: string;
  uid: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount: number;
  desc: string;
  date: Date;
}

const TransactionSchema: Schema = new Schema({
  id: { type: String, required: true },
  uid: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'payment'], required: true },
  amount: { type: Number, required: true },
  desc: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
