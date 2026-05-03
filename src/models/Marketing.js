import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['email', 'sms', 'push'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetGroups: [String], // e.g., 'doctors', 'patients', 'hospitals'
    recipients: [{ type: String }], // Individual emails or phone numbers
    scheduledAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['pending', 'queued', 'sending', 'completed', 'cancelled'], 
      default: 'pending' 
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      invalid: { type: Number, default: 0 },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: String,
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewCap: { type: Number, default: 0 }, // 0 for unlimited
    currentViews: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    position: String, // e.g., 'home_top', 'sidebar', 'news_article'
  },
  { timestamps: true }
);

export const Campaign = mongoose.model('Campaign', campaignSchema);
export const Ad = mongoose.model('Ad', adSchema);
