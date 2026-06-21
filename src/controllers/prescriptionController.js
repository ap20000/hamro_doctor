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

// @desc    Get prescriptions (Admin can view all, hospital admin can view doctor-linked prescriptions, patient/doctor see their own)
// @route   GET /api/v1/prescriptions
// @access  Private
export const getMyPrescriptions = async (req, res, next) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query = { patient: req.user._id };
    } else if (req.user.role === 'doctor') {
      query = { doctor: req.user._id };
    } else if (req.user.role === 'hospital') {
      const hospital = await User.findById(req.user._id);
      const enrolledDoctorIds = hospital?.hospitalDetails?.doctors?.map(d => d.doctor) || [];
      const associatedDoctors = await User.find({ associatedHospital: req.user._id }).select('_id');
      const associatedDoctorIds = associatedDoctors.map(d => d._id);
      
      const allHospitalDoctorIds = [...new Set([
        ...enrolledDoctorIds.map(id => id.toString()), 
        ...associatedDoctorIds.map(id => id.toString())
      ])];
      
      query = { doctor: { $in: allHospitalDoctorIds } };
    } else if (req.user.role === 'admin') {
      query = {}; // Admin can see all prescriptions
    } else {
      query = { _id: null }; // Other roles return empty by default
    }

    if (req.query.consultationId) {
      query.consultation = req.query.consultationId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('doctor', 'name doctorDetails')
      .populate('patient', 'name profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};
