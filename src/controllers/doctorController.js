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

// @desc    Get doctor's workplace hospitals
// @route   GET /api/v1/doctor/hospitals
// @access  Private (Doctor)
export const getHospitals = async (req, res, next) => {
  try {
    const doctor = await User.findById(req.user._id).select('doctorDetails.hospitals');
    res.json({
      success: true,
      count: doctor.doctorDetails.hospitals.length,
      hospitals: doctor.doctorDetails.hospitals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new hospital/workplace
// @route   POST /api/v1/doctor/hospitals
// @access  Private (Doctor)
export const addHospital = async (req, res, next) => {
  try {
    const { name, address, opdTime } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Hospital name is required' });
    }

    // Validate OPD time entries if provided
    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (opdTime && Array.isArray(opdTime)) {
      for (const slot of opdTime) {
        if (!validDays.includes(slot.day)) {
          return res.status(400).json({
            success: false,
            message: `Invalid day "${slot.day}". Must be one of: ${validDays.join(', ')}`
          });
        }
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: 'Each OPD slot must include startTime and endTime'
          });
        }
      }
    }

    const newHospital = {
      name: name.trim(),
      address: address?.trim() || '',
      opdTime: opdTime || []
    };

    const doctor = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { 'doctorDetails.hospitals': newHospital } },
      { new: true, runValidators: true }
    );

    const added = doctor.doctorDetails.hospitals[doctor.doctorDetails.hospitals.length - 1];

    res.status(201).json({
      success: true,
      message: 'Hospital added successfully',
      hospital: added
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital details (name, address, full OPD)
// @route   PUT /api/v1/doctor/hospitals/:hospitalId
// @access  Private (Doctor)
export const updateHospital = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { name, address, opdTime } = req.body;

    const doctor = await User.findById(req.user._id);
    const hospital = doctor.doctorDetails.hospitals.id(hospitalId);

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (opdTime && Array.isArray(opdTime)) {
      for (const slot of opdTime) {
        if (!validDays.includes(slot.day)) {
          return res.status(400).json({
            success: false,
            message: `Invalid day "${slot.day}". Must be one of: ${validDays.join(', ')}`
          });
        }
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: 'Each OPD slot must include startTime and endTime'
          });
        }
      }
    }

    if (name !== undefined) hospital.name = name.trim();
    if (address !== undefined) hospital.address = address.trim();
    if (opdTime !== undefined) hospital.opdTime = opdTime;

    await doctor.save();

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      hospital
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update OPD schedule only for a specific hospital
// @route   PUT /api/v1/doctor/hospitals/:hospitalId/opd
// @access  Private (Doctor)
export const updateOpdTime = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;
    const { opdTime } = req.body;

    if (!opdTime || !Array.isArray(opdTime)) {
      return res.status(400).json({
        success: false,
        message: 'opdTime must be an array of schedule objects'
      });
    }

    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const slot of opdTime) {
      if (!validDays.includes(slot.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day "${slot.day}". Must be one of: ${validDays.join(', ')}`
        });
      }
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Each OPD slot must include startTime and endTime'
        });
      }
    }

    const doctor = await User.findById(req.user._id);
    const hospital = doctor.doctorDetails.hospitals.id(hospitalId);

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    hospital.opdTime = opdTime;
    await doctor.save();

    res.json({
      success: true,
      message: 'OPD schedule updated successfully',
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        opdTime: hospital.opdTime
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a hospital from doctor's workplace list
// @route   DELETE /api/v1/doctor/hospitals/:hospitalId
// @access  Private (Doctor)
export const removeHospital = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;

    const doctor = await User.findById(req.user._id);
    const hospital = doctor.doctorDetails.hospitals.id(hospitalId);

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const hospitalName = hospital.name;
    hospital.deleteOne();
    await doctor.save();

    res.json({
      success: true,
      message: `"${hospitalName}" removed from your workplace list`
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

