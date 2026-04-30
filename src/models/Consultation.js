import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    amount: Number,
    consultationStart: Date, // When the 7-day window starts
    consultationEnd: Date,   // When the 7-day window ends
    sessions: [
      {
        startTime: Date,
        endTime: Date,
        type: {
          type: String,
          enum: ['audio', 'video', 'chat'],
        },
        durationInMinutes: Number,
      }
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        attachments: [String],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Consultation = mongoose.model('Consultation', consultationSchema);

export default Consultation;
