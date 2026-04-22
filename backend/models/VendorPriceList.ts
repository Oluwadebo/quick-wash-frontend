import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorPriceList extends Document {
  vendorUid: string;
  items: Array<{
    id: string;
    name: string;
    category?: string;
    icon?: string;
    washPrice: number;
    washDisabled: boolean;
    ironPrice: number;
    ironDisabled: boolean;
    washIronPrice: number;
    washIronDisabled: boolean;
    whitePremium: number;
    subItems?: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }>;
}

const VendorPriceListSchema: Schema = new Schema({
  vendorUid: { type: String, required: true, unique: true },
  items: [{
    id: String,
    name: String,
    category: String,
    icon: String,
    washPrice: Number,
    washDisabled: Boolean,
    ironPrice: Number,
    ironDisabled: Boolean,
    washIronPrice: Number,
    washIronDisabled: Boolean,
    whitePremium: Number,
    subItems: [{
      id: String,
      name: String,
      price: Number
    }]
  }]
}, { timestamps: true });

export default mongoose.models.VendorPriceList || mongoose.model<IVendorPriceList>('VendorPriceList', VendorPriceListSchema);
