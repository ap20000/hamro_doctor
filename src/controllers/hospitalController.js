import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import HealthPackageOrder from '../models/HealthPackageOrder.js';
import Transaction from '../models/Transaction.js';

// @desc    Get hospital dashboard stats
// @route   GET /api/v1/hospital/dashboard
// @access  Private (Hospital)
export const getHospitalDashboard = async (req, res, next) => {
  try {
    const hospitalId = req.user._id;

    const [
      appointmentsCount,
      packageOrdersCount,
      transactions,
      hospital
    ] = await Promise.all([
      Appointment.countDocuments({ hospital: hospitalId }),
      HealthPackageOrder.countDocuments({ hospital: hospitalId }),
      Transaction.find({ hospital: hospitalId }), // Assuming hospital transactions exist
      User.findById(hospitalId).select('hospitalDetails')
    ]);

    const totalEarnings = transactions.reduce((acc, curr) => acc + curr.netAmount, 0);

    res.json({
      success: true,
      stats: {
        totalDoctors: hospital.hospitalDetails.doctors.length,
        totalAppointments: appointmentsCount,
        totalPackageOrders: packageOrdersCount,
        totalEarnings,
        ...hospital.hospitalDetails.stats
      },
      recentOrders: await HealthPackageOrder.find({ hospital: hospitalId }).limit(5).sort({ createdAt: -1 })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage hospital doctors (Add/Update Rates)
// @route   POST /api/v1/hospital/doctors
// @access  Private (Hospital)
export const manageHospitalDoctors = async (req, res, next) => {
  try {
    const { doctorId, opdRate, availability } = req.body;
    const hospital = await User.findById(req.user._id);

    const doctorIndex = hospital.hospitalDetails.doctors.findIndex(
      (d) => d.doctor.toString() === doctorId
    );

    if (doctorIndex > -1) {
      hospital.hospitalDetails.doctors[doctorIndex].opdRate = opdRate;
      hospital.hospitalDetails.doctors[doctorIndex].availability = availability;
    } else {
      hospital.hospitalDetails.doctors.push({ doctor: doctorId, opdRate, availability });
    }

    await hospital.save();

    res.json({
      success: true,
      doctors: hospital.hospitalDetails.doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments list
// @route   GET /api/v1/hospital/appointments
// @access  Private (Hospital)
export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ hospital: req.user._id })
      .populate('patient', 'name phone')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/v1/hospital/appointments/:id
// @access  Private (Hospital)
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, remarks },
      { new: true }
    );

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital data
// @route   PUT /api/v1/hospital/profile
// @access  Private (Hospital)
export const updateHospitalProfile = async (req, res, next) => {
  try {
    const { name, description, address, healthPackages } = req.body;
    const hospital = await User.findById(req.user._id);

    hospital.name = name || hospital.name;
    hospital.profile.address = address || hospital.profile.address;
    hospital.hospitalDetails.description = description || hospital.hospitalDetails.description;
    if (healthPackages) hospital.hospitalDetails.healthPackages = healthPackages;

    await hospital.save();

    res.json({
      success: true,
      hospital
    });
  } catch (error) {
    next(error);
  }
};
