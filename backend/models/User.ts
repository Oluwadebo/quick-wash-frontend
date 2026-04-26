import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin' | 'super-sub-admin';
  isApproved: boolean;
  walletBalance: number;
  pendingBalance: number;
  trustPoints: number;
  trustScore: number;
  status: 'active' | 'restricted' | 'suspended';
  shopName?: string;
  vehicleType?: string;
  nin?: string;
  address?: string;
}

const UserSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['customer', 'vendor', 'rider', 'admin', 'super-sub-admin'], default: 'customer' },
  isApproved: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  trustPoints: { type: Number, default: 50 },
  trustScore: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'restricted', 'suspended'], default: 'active' },
  shopName: String,
  vehicleType: String,
  nin: String,
  address: String,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
