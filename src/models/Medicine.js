import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    pharmaceutical: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brandName: {
      type: String,
      required: true,
    },
    genericName: {
      type: String,
      required: true,
    },
    dosageForm: String, // e.g., Tablet, Syrup
    ingredients: [String],
    therapeuticClass: String,
    directionOfUse: String,
    uses: [String],
    sideEffects: [String],
    contraindications: [String],
    precautions: String,
    category: String,
    image: String,
    views: {
      type: Number,
      default: 0,
    },
    isPromoted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;
