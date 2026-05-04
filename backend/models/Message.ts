import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  orderId: string;
  senderId: string;
  senderRole: 'customer' | 'vendor' | 'rider' | 'admin';
  text: string;
  image?: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  orderId: { type: String, required: true, index: true },
  senderId: { type: String, required: true, index: true },
  senderRole: { type: String, enum: ['customer', 'vendor', 'rider', 'admin'], required: true },
  text: { type: String, required: true },
  image: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
