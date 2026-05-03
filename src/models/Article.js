import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String, // HTML content from WYSIWYG
      required: true,
    },
    featureImage: String,
    category: String,
    tags: [String],
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'rejected'],
      default: 'pending', // Requires admin moderation
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: Date,
  },
  {
    timestamps: true,
  }
);

const Article = mongoose.model('Article', articleSchema);

export default Article;
