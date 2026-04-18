import mongoose from 'mongoose';

const VendorPriceListSchema = new mongoose.Schema({
  vendorUid: { type: String, required: true },
  services: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String },
    icon: { type: String },
    washPrice: { type: Number },
    ironPrice: { type: Number },
    washIronPrice: { type: Number },
    whitePremium: { type: Number },
    washDisabled: { type: Boolean },
    ironDisabled: { type: Boolean },
    washIronDisabled: { type: Boolean },
    subItems: [{
      id: { type: String },
      name: { type: String },
      price: { type: Number }
    }]
  }]
});

export default mongoose.models.VendorPriceList || mongoose.model('VendorPriceList', VendorPriceListSchema);
