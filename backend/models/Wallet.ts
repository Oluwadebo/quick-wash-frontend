import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: string;
  balance: number;
  pendingBalance: number;
  totalEarnings: number;
  lastPayoutAt?: Date;
  transferReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  balance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  lastPayoutAt: { type: Date },
  transferReference: { type: String, unique: true, sparse: true },
}, { timestamps: true });

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
