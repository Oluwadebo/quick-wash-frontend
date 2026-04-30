import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email: string; // New field
  password?: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin' | 'super-sub-admin';
  isApproved: boolean;
  walletBalance: number;
  pendingBalance: number;
  withdrawalRequested: boolean;
  trustPoints: number;
  trustScore: number;
  status: 'active' | 'restricted' | 'suspended';
  restrictionExpires?: Date;
  lastPenaltyAt?: Date;
  lastRecoveryAt?: Date;
  shopName?: string;
  vehicleType?: string;
  nin?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  address?: string;
  shopAddress?: string;
  landmark?: string;
  shopImage?: string; // New field for vendors
  isShopClosed?: boolean;
  returnTime?: string;
  ninImage?: string;  // New field for riders
  transferReference?: string; // New field for identifying transfers
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  role: { type: String, enum: ['customer', 'vendor', 'rider', 'admin', 'super-sub-admin'], default: 'customer', index: true },
  isApproved: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  withdrawalRequested: { type: Boolean, default: false },
  trustPoints: { type: Number, default: 100 },
  trustScore: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'restricted', 'suspended'], default: 'active' },
  restrictionExpires: { type: Date },
  lastPenaltyAt: { type: Date },
  lastRecoveryAt: { type: Date },
  shopName: { type: String },
  vehicleType: { type: String },
  nin: { type: String },
  whatsappNumber: { type: String },
  bankAccountName: { type: String },
  bankAccountNumber: { type: String },
  bankName: { type: String },
  turnaroundTime: { type: String },
  capacity: { type: Number },
  address: { type: String },
  shopAddress: { type: String },
  landmark: { type: String },
  shopImage: { type: String },
  isShopClosed: { type: Boolean, default: false },
  returnTime: { type: String },
  ninImage: { type: String },
  transferReference: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Avoid model re-compilation in development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
