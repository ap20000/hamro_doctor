import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    startDate: Date,
    endDate: Date,
    hostedBy: String,
    venue: String,
    eventUrl: String,
    featuredImage: String,
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
  },
  { timestamps: true }
);

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    featuredImage: String,
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        isApproved: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    youtubeId: { type: String, required: true },
    source: String,
    tags: [{ type: String }],
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Can be doctor or hospital
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
export const Blog = mongoose.model('Blog', blogSchema);
export const Video = mongoose.model('Video', videoSchema);
