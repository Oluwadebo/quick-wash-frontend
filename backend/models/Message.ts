import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  orderId?: string;
  senderId: string;
  receiverId?: string;
  senderRole: 'customer' | 'vendor' | 'rider' | 'admin';
  text: string;
  image?: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  orderId: { type: String, index: true },
  senderId: { type: String, required: true, index: true },
  receiverId: { type: String, index: true },
  senderRole: { type: String, enum: ['customer', 'vendor', 'rider', 'admin'], required: true },
  text: { type: String, required: true },
  image: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Compound index for finding conversation between two users
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, senderId: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
