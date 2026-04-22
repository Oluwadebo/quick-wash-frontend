import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  name: string;
  logo?: string;
  primaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  emergencyAlert?: string;
  maintenanceMode?: boolean;
  announcement?: string;
}

const SiteSettingsSchema: Schema = new Schema({
  name: { type: String, default: 'Quick-Wash' },
  logo: { type: String },
  primaryColor: { type: String, default: '#1a56db' },
  contactEmail: { type: String, default: 'support@quickwash.app' },
  contactPhone: { type: String, default: '+234 812 345 6789' },
  emergencyAlert: { type: String },
  maintenanceMode: { type: Boolean, default: false },
  announcement: { type: String, default: 'Welcome to the new Quick-Wash platform!' }
}, { timestamps: true });

export default mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
