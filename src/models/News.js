import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    language: { type: String, enum: ['Nepali', 'English'], default: 'English' },
    category: { type: String, required: true },
    pradesh: { 
      type: String, 
      enum: ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim', 'All'], 
      default: 'All' 
    },
    featuredImage: String,
    isFeatured: { type: Boolean, default: false },
    linkedEntities: {
      doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      hospitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      pharmaceuticals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views: { type: Number, default: 0 },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String, // For guest comments
        text: { type: String, required: true },
        isApproved: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

const News = mongoose.model('News', newsSchema);

export default News;
