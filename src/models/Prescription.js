import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    diagnosis: String,
    medicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instruction: String,
      }
    ],
    advice: String,
    signature: String, // URL/Path to signature used
    pdfUrl: String,
  },
  {
    timestamps: true,
  }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
