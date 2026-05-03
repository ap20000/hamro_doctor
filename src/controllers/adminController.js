import User from '../models/User.js';
import Consultation from '../models/Consultation.js';
import Appointment from '../models/Appointment.js';
import Article from '../models/Article.js';
import Transaction from '../models/Transaction.js';
import { Blog, Event, Video } from '../models/Content.js';
import { Coupon, BloodDonor, BloodRequest } from '../models/Operations.js';

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/dashboard
// @access  Private (Admin)
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalDoctors,
      totalHospitals,
      totalPatients,
      activeConsultations,
      awaitingConsultations,
      recentAppointments,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'hospital' }),
      User.countDocuments({ role: 'patient' }),
      Consultation.countDocuments({ status: 'active' }),
      Consultation.countDocuments({ status: 'pending' }),
      Appointment.find().limit(5).sort({ createdAt: -1 }).populate('doctor patient hospital'),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalDoctors,
        totalHospitals,
        totalPatients,
        activeConsultations,
        awaitingConsultations,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentAppointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage institution approvals
// @route   PATCH /api/v1/admin/institutions/:id/verify
// @access  Private (Admin)
export const verifyInstitution = async (req, res, next) => {
  try {
    const { status } = req.body; // approved, rejected
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('Institution not found');
    }

    if (user.role === 'hospital') {
      user.hospitalDetails.listingRequestStatus = status;
    } else if (user.role === 'doctor') {
      user.doctorDetails.isApproved = (status === 'approved');
    }

    await user.save();

    res.json({
      success: true,
      message: `Institution ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue reports
// @route   GET /api/v1/admin/reports/revenue
// @access  Private (Admin)
export const getRevenueReport = async (req, res, next) => {
  try {
    const revenue = await Transaction.aggregate([
      {
        $group: {
          _id: { 
            method: '$paymentMethod',
            type: '$transactionType'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      revenue
    });
  } catch (error) {
    next(error);
  }
};
