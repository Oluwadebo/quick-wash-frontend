import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminInvite extends Document {
  token: string;
  fullName: string;
  email: string;
  role: 'admin' | 'super-sub-admin';
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const AdminInviteSchema: Schema = new Schema({
  token: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'super-sub-admin'], default: 'admin' },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.AdminInvite || mongoose.model<IAdminInvite>('AdminInvite', AdminInviteSchema);
