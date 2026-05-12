import User from '../models/User.js';

// @desc    Get all users with filters
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { role, isApproved, isVerified } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isApproved !== undefined) {
      if (role === 'doctor') query['doctorDetails.isApproved'] = isApproved === 'true';
      if (role === 'hospital') query['hospitalDetails.listingRequestStatus'] = isApproved === 'true' ? 'approved' : { $ne: 'approved' };
    }
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const users = await User.find(query).sort('-createdAt');
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject doctor or hospital
// @route   PUT /api/v1/admin/approve/:id
// @access  Private/Admin
export const approveUser = async (req, res, next) => {
  try {
    const { status, type } = req.body; // status: true/false for doctor, 'approved'/'rejected' for hospital
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'doctor') {
      user.doctorDetails.isApproved = status;
    } else if (user.role === 'hospital') {
      user.hospitalDetails.listingRequestStatus = status ? 'approved' : 'rejected';
    }

    await user.save();

    res.json({
      success: true,
      message: `${user.role} ${status ? 'approved' : 'rejected'} successfully`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user by Admin
// @route   POST /api/v1/admin/onboard
// @access  Private/Admin
export const onboardUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      isVerified: true, // Admin created users are verified by default
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
