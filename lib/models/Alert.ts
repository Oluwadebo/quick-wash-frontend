import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  msg: { type: String, required: true },
  color: { type: String, required: true },
  time: { type: Date, default: Date.now },
  riderUid: { type: String }
});

export default mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
