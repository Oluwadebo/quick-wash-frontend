import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
   id: string; // 'global'
  name: string;
  logo: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  emergencyAlert: string;
  maintenanceMode: boolean;
  announcement: string;
  landmarks: { id: string; name: string; active: boolean }[];
}

const SiteSettingsSchema: Schema = new Schema({
  id: { type: String, default: 'global', unique: true },
  name: { type: String, default: 'Quick-Wash' },
  logo: { type: String, default: '' },
  primaryColor: { type: String, default: '#1a56db' },
  contactEmail: { type: String, default: 'support@quickwash.edu' },
  contactPhone: { type: String, default: '09012345678' },
  emergencyAlert: { type: String, default: '' },
  maintenanceMode: { type: Boolean, default: false },
  announcement: { type: String, default: 'Welcome to Quick-Wash! Your campus laundry partner.' },
  landmarks: [{
    id: String,
    name: String,
    active: { type: Boolean, default: true }
  }]
}, { timestamps: true });

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
