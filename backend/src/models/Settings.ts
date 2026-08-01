import { Schema, model, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  singleton: 'main';
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo: string;
  favicon: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  seoDefaults: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
  };
  contactEmail: string;
  commentsRequireApproval: boolean;
  maintenanceMode: boolean;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    singleton: { type: String, enum: ['main'], default: 'main', unique: true },
    siteName: { type: String, default: 'Digital Gyaan' },
    siteDescription: {
      type: String,
      default:
        'Digital Gyaan provides helpful technology guides, Android app reviews, AI tools, cyber safety tips and digital updates for Indian users.',
    },
    siteUrl: { type: String, default: 'https://digitalgyaan.site' },
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    socialLinks: {
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    seoDefaults: {
      metaTitle: { type: String, default: 'Digital Gyaan' },
      metaDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
    },
    contactEmail: { type: String, default: '' },
    commentsRequireApproval: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings: Model<ISettings> = model<ISettings>('Settings', settingsSchema);
