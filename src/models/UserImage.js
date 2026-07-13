import mongoose from 'mongoose';

const userImageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    // Storing full Base64 image string or binary in MongoDB so user can visit anywhere/anytime and see the image from DB
    imageData: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const UserImage = mongoose.model('UserImage', userImageSchema);

export default UserImage;
