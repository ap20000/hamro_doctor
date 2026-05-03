import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountValue: { type: Number, required: true },
    discountUnit: { type: String, enum: ['value', 'percentage'], required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: Number,
    startDate: Date,
    endDate: Date,
    totalUsageAllowed: Number,
    usagePerCustomer: { type: Number, default: 1 },
    usageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

const bloodDonorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    age: Number,
    district: String,
    phone: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
    lastDonatedAt: Date,
  },
  { timestamps: true }
);

const bloodRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    age: Number,
    bloodGroup: { type: String, required: true },
    district: String,
    quantity: Number,
    phone: { type: String, required: true },
    status: { type: String, enum: ['open', 'fulfilled', 'cancelled'], default: 'open' },
  },
  { timestamps: true }
);

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    image: String,
    location: String, // Where it's displayed
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
export const BloodDonor = mongoose.model('BloodDonor', bloodDonorSchema);
export const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
export const Offer = mongoose.model('Offer', offerSchema);
