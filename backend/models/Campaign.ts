import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Paused', 'Ended'], default: 'Active' },
  reach: { type: String, default: '0' },
  conversion: { type: String, default: '0%' },
  color: { type: String, default: 'bg-primary' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Campaign', campaignSchema);
