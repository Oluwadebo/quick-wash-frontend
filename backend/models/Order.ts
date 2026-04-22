import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  id: string; // Friendly ID
  customerUid: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorName: string;
  vendorPhone?: string;
  customerAddress?: string;
  customerLandmark?: string;
  vendorLandmark?: string;
  vendorAddress?: string;
  items: string;
  itemsPrice: number;
  riderFee: number;
  totalPrice: number;
  status: string;
  color: string;
  time: Date;
  riderUid?: string;
  riderName?: string;
  riderPhone?: string;
  pickupAddress?: string;
  code1?: string;
  code2?: string;
  code3?: string;
  code4?: string;
  handoverCode?: string;
  readyForDeliveryAt?: Date;
  washingAt?: Date;
  readyAt?: Date;
  pickedUpAt?: Date;
  pickedUpDeliveryAt?: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  claimedAt?: Date;
  disputed?: boolean;
  issueDescription?: string;
  disputedAt?: Date;
  paymentMethod: string;
  payoutReleased80?: boolean;
  payoutReleased20?: boolean;
  riderPaid?: boolean;
  riderFeePaid1?: boolean;
  riderFeePaid2?: boolean;
  evidenceImage?: string;
  vendorEvidenceImage?: string;
  refundAmount?: number;
  consecutiveReturns?: number;
  returnReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  customerUid: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  vendorPhone: { type: String },
  customerAddress: { type: String },
  customerLandmark: { type: String },
  vendorLandmark: { type: String },
  vendorAddress: { type: String },
  items: { type: String, required: true },
  itemsPrice: { type: Number, required: true },
  riderFee: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, required: true },
  color: { type: String, required: true },
  time: { type: Date, default: Date.now },
  riderUid: { type: String },
  riderName: { type: String },
  riderPhone: { type: String },
  pickupAddress: { type: String },
  code1: { type: String },
  code2: { type: String },
  code3: { type: String },
  code4: { type: String },
  handoverCode: { type: String },
  readyForDeliveryAt: { type: Date },
  washingAt: { type: Date },
  readyAt: { type: Date },
  pickedUpAt: { type: Date },
  claimedAt: { type: Date },
  pickedUpDeliveryAt: { type: Date },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
  completedAt: { type: Date },
  disputed: { type: Boolean, default: false },
  issueDescription: { type: String },
  disputedAt: { type: Date },
  payoutReleased80: { type: Boolean, default: false },
  payoutReleased20: { type: Boolean, default: false },
  riderPaid: { type: Boolean, default: false },
  riderFeePaid1: { type: Boolean, default: false },
  riderFeePaid2: { type: Boolean, default: false },
  evidenceImage: { type: String },
  vendorEvidenceImage: { type: String },
  refundAmount: { type: Number },
  consecutiveReturns: { type: Number, default: 0 },
  returnReason: { type: String },
  paymentMethod: { type: String, default: 'wallet' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
