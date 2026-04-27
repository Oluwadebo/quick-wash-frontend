import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSetting extends Document {
  id: string; // 'global'
  name: string;
  logo: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  emergencyAlert: string;
  maintenanceMode: boolean;
  announcement: string;
  commissionRate: number;
  serviceFee: number;
  landmarks: { id: string; name: string; active: boolean }[];
}

const SiteSettingSchema: Schema = new Schema({
  id: { type: String, default: 'global', unique: true },
  name: { type: String, default: 'Quick-Wash' },
  logo: { type: String, default: '' },
  primaryColor: { type: String, default: '#1a56db' },
  contactEmail: { type: String, default: 'support@quickwash.edu' },
  contactPhone: { type: String, default: '09012345678' },
  emergencyAlert: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
  announcement: { type: String, default: 'Welcome to Quick-Wash! Your campus laundry partner.' },
  commissionRate: { type: Number, default: 20 },
  serviceFee: { type: Number, default: 0 },
  landmarks: [{
    id: String,
    name: String,
    active: { type: Boolean, default: true }
  }]
}, { timestamps: true });

export default mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);
// export default mongoose.models.SiteSetting || mongoose.model('SiteSetting', SiteSettingSchema);
