import User from '../models/User.js';
import Consultation from '../models/Consultation.js';
import Article from '../models/Article.js';
import Story from '../models/Story.js';
import Transaction from '../models/Transaction.js';

// @desc    Get doctor dashboard stats
// @route   GET /api/v1/doctor/dashboard
// @access  Private (Doctor)
export const getDashboardStats = async (req, res, next) => {
  try {
    const doctorId = req.user._id;

    const [
      consultationsCount,
      articlesCount,
      storiesCount,
      transactions
    ] = await Promise.all([
      Consultation.countDocuments({ doctor: doctorId }),
      Article.countDocuments({ author: doctorId }),
      Story.countDocuments({ author: doctorId }),
      Transaction.find({ doctor: doctorId })
    ]);

    const netEarnings = transactions.reduce((acc, curr) => acc + curr.netAmount, 0);

    const doctor = await User.findById(doctorId).select('doctorDetails.stats');

    res.json({
      success: true,
      stats: {
        noOfConsultations: consultationsCount,
        articlesPublished: articlesCount,
        noOfStories: storiesCount,
        netEarnings,
        ...doctor.doctorDetails.stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor online/offline status
// @route   PATCH /api/v1/doctor/status
// @access  Private (Doctor)
export const updateStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const doctor = await User.findByIdAndUpdate(
      req.user._id,
      { 'doctorDetails.isOnline': isOnline },
      { new: true }
    );

    res.json({
      success: true,
      isOnline: doctor.doctorDetails.isOnline
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage hospitals (Add/Update)
// @route   POST /api/v1/doctor/hospitals
// @access  Private (Doctor)
export const manageHospitals = async (req, res, next) => {
  try {
    const { hospitals } = req.body;
    const doctor = await User.findByIdAndUpdate(
      req.user._id,
      { 'doctorDetails.hospitals': hospitals },
      { new: true }
    );

    res.json({
      success: true,
      hospitals: doctor.doctorDetails.hospitals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get earnings report
// @route   GET /api/v1/doctor/earnings
// @access  Private (Doctor)
export const getEarningsReport = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ doctor: req.user._id })
      .populate('patient', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile
// @route   PUT /api/v1/doctor/profile
// @access  Private (Doctor)
export const updateProfile = async (req, res, next) => {
  try {
    const { doctorDetails, profile, name } = req.body;
    
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }
    if (doctorDetails) {
      user.doctorDetails = { ...user.doctorDetails.toObject(), ...doctorDetails };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

