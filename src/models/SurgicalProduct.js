import mongoose from 'mongoose';

const surgicalProductSchema = new mongoose.Schema(
  {
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
    },
    category: String,
    images: [String],
    specifications: [
      {
        key: String,
        value: String,
      }
    ],
    views: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const SurgicalProduct = mongoose.model('SurgicalProduct', surgicalProductSchema);

export default SurgicalProduct;
