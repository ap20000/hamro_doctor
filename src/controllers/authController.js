import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendSMS } from '../utils/smsService.js';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, username, email, phone, password, role, address, doctorDetails, hospitalDetails } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }, { username }] });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email, phone or username already exists');
    }

    if (!role || !['doctor', 'patient', 'hospital', 'nurse'].includes(role)) {
      res.status(400);
      throw new Error('Please specify a valid role (doctor, patient, hospital, or nurse)');
    }

    let userPayload = {
      name,
      username,
      email,
      phone,
      password,
      role,
      profile: { address: address || '' },
      doctorDetails: role === 'doctor' ? doctorDetails : undefined,
    };

    if (role === 'hospital') {
      userPayload.hospitalDetails = hospitalDetails || { listingRequestStatus: 'pending' };
      userPayload.isVerified = true; // Hospitals skip OTP, wait for admin approval
      
      const user = await User.create(userPayload);
      
      return res.status(201).json({
        success: true,
        message: 'Registration request sent successfully, Contact administration for approval',
        userId: user._id,
      });
    }

    // Generate OTP for other roles
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpireAt = new Date(Date.now() + process.env.OTP_EXPIRE * 60000);
    
    userPayload.otp = {
      code: otpCode,
      expireAt: otpExpireAt,
    };

    const user = await User.create(userPayload);

    // Send real SMS
    const message = `Your Hamro Doctor OTP is ${otpCode}. It expires in ${process.env.OTP_EXPIRE} minutes.`;
    console.log(`[DEBUG] Registration OTP for ${phone}: ${otpCode}`);
    await sendSMS(phone, message);

    res.status(201).json({
      success: true,
      message: 'User registered. Please verify OTP sent to your phone.',
      userId: user._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.otp.code !== code || user.otp.expireAt < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp.code = undefined;
    user.otp.expireAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        doctorDetails: user.doctorDetails
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { loginId, password } = req.body; // loginId can be email, phone or username

    const user = await User.findOne({ 
      $or: [{ email: loginId }, { phone: loginId }, { username: loginId }] 
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        res.status(401);
        throw new Error('Please verify your account first');
      }

      if (user.role === 'hospital') {
        if (!user.hospitalDetails || user.hospitalDetails.listingRequestStatus !== 'approved') {
          res.status(401);
          throw new Error('Your registration request is pending admin approval');
        }
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile,
          doctorDetails: user.doctorDetails
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid email/phone or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        success: true,
        user,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password (Send OTP to Phone)
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      res.status(404);
      throw new Error('No user found with this phone number');
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpireAt = new Date(Date.now() + process.env.OTP_EXPIRE * 60000);

    user.otp = {
      code: otpCode,
      expireAt: otpExpireAt,
    };
    await user.save();

    // Send SMS
    const message = `Your Hamro Doctor password reset OTP is ${otpCode}. It expires in ${process.env.OTP_EXPIRE} minutes.`;
    console.log(`[DEBUG] Password Reset OTP for ${phone}: ${otpCode}`);
    await sendSMS(phone, message);

    res.json({
      success: true,
      message: 'Password reset OTP sent to your phone',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { phone, code, newPassword } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.otp.code !== code || user.otp.expireAt < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // Update password
    user.password = newPassword;
    user.otp.code = undefined;
    user.otp.expireAt = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

