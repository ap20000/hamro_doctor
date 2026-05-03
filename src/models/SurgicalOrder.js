import mongoose from 'mongoose';

const surgicalOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    distributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SurgicalProduct',
        },
        quantity: Number,
        price: Number,
      }
    ],
    totalAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    shippingAddress: String,
  },
  {
    timestamps: true,
  }
);

const SurgicalOrder = mongoose.model('SurgicalOrder', surgicalOrderSchema);

export default SurgicalOrder;
