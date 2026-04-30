import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: String,
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'jpeg', 'png'],
    },
    recordType: {
      type: String,
      enum: ['Report', 'Prescription', 'Lab Result', 'Other'],
      default: 'Report',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // If it's a doctor-generated record
    },
    sharedWith: [
      {
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        expireAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
