import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'vendor', 'rider', 'admin'], default: 'customer' },
  isApproved: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  trustPoints: { type: Number, default: 100 },
  trustScore: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'restricted', 'suspended'], default: 'active' },
  withdrawalRequested: { type: Boolean, default: false },
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
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
