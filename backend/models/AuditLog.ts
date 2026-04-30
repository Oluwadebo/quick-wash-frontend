import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  admin: { type: String, required: true },
  details: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', auditLogSchema);
