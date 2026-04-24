import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  admin: string;
  adminUid: string;
  target: string;
  details?: string;
  time: Date;
}

const AuditLogSchema: Schema = new Schema({
  action: { type: String, required: true },
  admin: { type: String, required: true },
  adminUid: { type: String, required: true },
  target: { type: String, required: true },
  details: { type: String },
  time: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
