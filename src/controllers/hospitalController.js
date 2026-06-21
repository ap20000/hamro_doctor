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

// @desc    Get all users linked to this hospital
// @route   GET /api/v1/hospital/users
// @access  Private/Hospital
export const getHospitalUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    
    // Get all doctor IDs who have an approved link status with this hospital
    const hospital = await User.findById(req.user._id);
    const approvedLinkDoctorIds = hospital?.hospitalDetails?.doctors
      ?.filter(d => d.status === 'approved')
      ?.map(d => d.doctor) || [];

    let query = {};
    if (role) {
      if (role === 'doctor') {
        query = {
          role: 'doctor',
          $or: [
            { associatedHospital: req.user._id },
            { _id: { $in: approvedLinkDoctorIds } }
          ]
        };
      } else {
        query = { associatedHospital: req.user._id, role };
      }
    } else {
      // Fetching all roles combined
      query = {
        $or: [
          { associatedHospital: req.user._id },
          { _id: { $in: approvedLinkDoctorIds }, role: 'doctor' }
        ]
      };
    }

    const users = await User.find(query).sort('-createdAt');

    // Attach joinMethod metadata
    const usersWithSource = users.map(user => {
      const userObj = user.toObject();
      if (user.role === 'doctor') {
        if (user.associatedHospital && user.associatedHospital.toString() === req.user._id.toString()) {
          userObj.joinMethod = 'Added by Hospital Admin';
        } else {
          userObj.joinMethod = 'Joined through Link Request';
        }
      } else {
        userObj.joinMethod = 'Added by Hospital Admin';
      }
      return userObj;
    });

    res.json({
      success: true,
      count: usersWithSource.length,
      users: usersWithSource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user by Hospital
// @route   POST /api/v1/hospital/onboard
// @access  Private/Hospital
export const onboardHospitalUser = async (req, res, next) => {
  try {
    const { name, username, email, phone, password, role } = req.body;

    if (!['doctor', 'patient', 'nurse'].includes(role)) {
      res.status(400);
      throw new Error('Hospital can only onboard doctors, nurses, and patients');
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone }, { username }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const userPayload = {
      name,
      username,
      email,
      phone,
      password,
      role,
      isVerified: true,
      associatedHospital: req.user._id
    };

    if (role === 'doctor') {
      userPayload.doctorDetails = { isApproved: true };
    }

    const user = await User.create(userPayload);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject doctor link request
// @route   PATCH /api/v1/hospital/link-requests/:doctorId
// @access  Private/Hospital
export const approveHospitalLink = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Status must be approved or rejected');
    }

    const hospital = await User.findById(req.user._id);
    if (!hospital) {
      res.status(404);
      throw new Error('Hospital not found');
    }

    const doctorsList = hospital.hospitalDetails?.doctors || [];
    const doctorIndex = doctorsList.findIndex(
      d => d.doctor?.toString() === req.params.doctorId
    );

    if (doctorIndex === -1) {
      res.status(404);
      throw new Error('Link request not found for this doctor');
    }

    // Use updateOne to avoid full document validation
    await User.updateOne(
      { _id: req.user._id, 'hospitalDetails.doctors.doctor': req.params.doctorId },
      { $set: { 'hospitalDetails.doctors.$.status': status } }
    );

    // Fetch the updated hospital to return the correct doctors list
    const updatedHospital = await User.findById(req.user._id);

    res.json({
      success: true,
      message: `Doctor link request ${status} successfully`,
      doctors: updatedHospital.hospitalDetails.doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital link requests
// @route   GET /api/v1/hospital/link-requests
// @access  Private/Hospital
export const getHospitalLinkRequests = async (req, res, next) => {
  try {
    const hospital = await User.findById(req.user._id).populate({
      path: 'hospitalDetails.doctors.doctor',
      select: 'name email phone doctorDetails'
    });

    const requests = hospital.hospitalDetails.doctors.map(d => ({
      _id: d.doctor?._id,
      name: d.doctor?.name,
      email: d.doctor?.email,
      phone: d.doctor?.phone,
      speciality: d.doctor?.doctorDetails?.speciality,
      status: d.status
    })).filter(r => r._id); // ensure doctor exists

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};
