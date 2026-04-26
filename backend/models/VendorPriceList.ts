import mongoose, { Schema, Document } from 'mongoose';

const VendorPriceListSchema: Schema = new Schema({
  vendorUid: { type: String, required: true, unique: true },
  prices: [{
    id: String,
    name: String,
    price: Number,
    category: String
  }]
}, { timestamps: true });

export default mongoose.models.VendorPriceList || mongoose.model('VendorPriceList', VendorPriceListSchema);
