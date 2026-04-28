import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorPriceList extends Document {
  vendorUid: string;
  prices: any[];
  createdAt: Date;
  updatedAt: Date;
}

const VendorPriceListSchema: Schema = new Schema({
  vendorUid: { type: String, required: true, unique: true },
  prices: { type: Array, default: [] },
}, { timestamps: true });

export default mongoose.models.VendorPriceList || mongoose.model<IVendorPriceList>('VendorPriceList', VendorPriceListSchema);
