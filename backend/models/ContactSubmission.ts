import mongoose, { Schema, Document } from 'mongoose';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

const ContactSubmissionSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'reviewed', 'resolved'] },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.ContactSubmission || mongoose.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);
