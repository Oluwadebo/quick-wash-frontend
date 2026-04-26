import mongoose, { Schema, Document } from 'mongoose';

const OrderSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  customerUid: { type: String, required: true },
  customerName: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  items: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, required: true },
  color: { type: String },
  customerLandmark: { type: String },
  vendorLandmark: { type: String },
  riderUid: { type: String },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
