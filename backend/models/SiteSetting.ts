import mongoose, { Schema, Document } from 'mongoose';

const SiteSettingSchema: Schema = new Schema({
  id: { type: String, default: 'global', unique: true },
  name: { type: String, default: 'Quick-Wash' },
  logo: { type: String, default: '' },
  landmarks: [{
    id: String,
    name: String,
    active: { type: Boolean, default: true }
  }]
}, { timestamps: true });

export default mongoose.models.SiteSetting || mongoose.model('SiteSetting', SiteSettingSchema);
