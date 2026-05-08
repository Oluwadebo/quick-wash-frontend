import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryZone extends Document {
  fromLandmark: string;
  toLandmark: string;
  fee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryZoneSchema: Schema = new Schema({
  fromLandmark: { type: String, required: true, index: true },
  toLandmark: { type: String, required: true, index: true },
  fee: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique combination of from and to landmarks
DeliveryZoneSchema.index({ fromLandmark: 1, toLandmark: 1 }, { unique: true });

export default mongoose.models.DeliveryZone || mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);
