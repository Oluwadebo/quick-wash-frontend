import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  vendorId: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
    basePrice: { type: Number, default: 0 }
  }],
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to ensure one draft per user-vendor pair
draftSchema.index({ userId: 1, vendorId: 1 }, { unique: true });

export default mongoose.model('Draft', draftSchema);
