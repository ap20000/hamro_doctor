import mongoose from 'mongoose';

const healthPackageOrderSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    packageDetails: {
      name: String,
      price: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    medicalReport: String, // URL to uploaded report after testing
  },
  {
    timestamps: true,
  }
);

const HealthPackageOrder = mongoose.model('HealthPackageOrder', healthPackageOrderSchema);

export default HealthPackageOrder;
