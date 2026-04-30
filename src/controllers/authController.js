import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendSMS } from '../utils/smsService.js';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpireAt = new Date(Date.now() + process.env.OTP_EXPIRE * 60000);

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'patient',
      otp: {
        code: otpCode,
        expireAt: otpExpireAt,
      },
    });

    // Send real SMS
    const message = `Your Hamro Doctor OTP is ${otpCode}. It expires in ${process.env.OTP_EXPIRE} minutes.`;
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
    const { loginId, password } = req.body; // loginId can be email or phone

    const user = await User.findOne({ 
      $or: [{ email: loginId }, { phone: loginId }] 
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        res.status(401);
        throw new Error('Please verify your account first');
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
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
