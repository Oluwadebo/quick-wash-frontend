import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  budget: { type: Number, required: true }
});

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
