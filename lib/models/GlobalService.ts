import mongoose from 'mongoose';

const GlobalServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  icon: { type: String },
  basePrice: { type: Number, required: true }
});

export default mongoose.models.GlobalService || mongoose.model('GlobalService', GlobalServiceSchema);
