import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { generatePrescriptionPDF } from '../utils/pdfGenerator.js';

// @desc    Create prescription
// @route   POST /api/v1/prescriptions
// @access  Private (Doctor)
export const createPrescription = async (req, res, next) => {
  try {
    const { consultationId, patientId, diagnosis, medicines, advice } = req.body;

    const patient = await User.findById(patientId);
    const doctor = await User.findById(req.user._id);

    const prescription = await Prescription.create({
      consultation: consultationId,
      doctor: req.user._id,
      patient: patientId,
      diagnosis,
      medicines,
      advice,
      signature: doctor.doctorDetails?.signature,
    });

    // Generate PDF
    const pdfPath = await generatePrescriptionPDF(prescription, doctor, patient);
    prescription.pdfUrl = pdfPath;
    await prescription.save();

    res.status(201).json({
      success: true,
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my prescriptions
// @route   GET /api/v1/prescriptions
// @access  Private
export const getMyPrescriptions = async (req, res, next) => {
  try {
    const query = req.user.role === 'patient' 
      ? { patient: req.user._id } 
      : { doctor: req.user._id };

    const prescriptions = await Prescription.find(query)
      .populate('doctor', 'name doctorDetails')
      .populate('patient', 'name profile');

    res.json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};
