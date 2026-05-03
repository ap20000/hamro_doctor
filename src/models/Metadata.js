import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: String,
    featuredImage: String,
    isAvailableForDiscussion: { type: Boolean, default: true },
    isAvailableForConsult: { type: Boolean, default: true },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const diseaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    symptoms: [String],
    causes: String,
    diagnosis: String,
    prevention: String,
    riskFactors: String,
    complications: String,
    treatments: String,
    references: [String],
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  },
  { timestamps: true }
);

const healthClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    phone: String,
    email: String,
    website: String,
    services: [String],
    trainers: [String],
    featuredImage: String,
  },
  { timestamps: true }
);

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: String,
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const testimonialSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    role: String,
    content: String,
    avatar: String,
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
export const Disease = mongoose.model('Disease', diseaseSchema);
export const HealthClub = mongoose.model('HealthClub', healthClubSchema);
export const Page = mongoose.model('Page', pageSchema);
export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
