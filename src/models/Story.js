import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Doctor or Admin
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: String,
    category: {
      type: String,
      enum: ['Health Tips', 'Medical News', 'Success Story', 'Other'],
      default: 'Health Tips',
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model('Story', storySchema);

export default Story;
