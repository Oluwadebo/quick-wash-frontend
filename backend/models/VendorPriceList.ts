import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorPriceList extends Document {
  vendorId: string;
  services: any[];
  createdAt: Date;
  updatedAt: Date;
}

const VendorPriceListSchema: Schema = new Schema({
  vendorId: { type: String, required: true, unique: true },
  services: { type: Array, default: [] },
}, { timestamps: true });

export default mongoose.models.VendorPriceList || mongoose.model<IVendorPriceList>('VendorPriceList', VendorPriceListSchema);
