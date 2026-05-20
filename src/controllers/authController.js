import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendSMS } from '../utils/smsService.js';
import { sendEmail } from '../utils/sendEmail.js';

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

// Helper to mask email
const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
};

// Helper to mask phone
const maskPhone = (phone) => {
  if (!phone) return '';
  if (phone.length <= 4) return '****';
  return `${phone.slice(0, 2)}${'*'.repeat(phone.length - 5)}${phone.slice(-3)}`;
};

// @desc    Forgot Password (Multi-step: Detect user, send OTP via Email/SMS)
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { loginId, method } = req.body;

    if (!loginId) {
      res.status(400);
      throw new Error('Please provide email or phone number');
    }

    // Find user (by email or phone or username)
    const user = await User.findOne({
      $or: [{ email: loginId }, { phone: loginId }, { username: loginId }]
    });

    if (!user) {
      res.status(404);
      throw new Error('No account found with this email or phone number');
    }

    // STEP 1: Account Detection (if method is not provided)
    if (!method) {
      const methods = [];
      if (user.email) methods.push('email');
      if (user.phone) methods.push('phone');

      return res.status(200).json({
        success: true,
        step: 'detect',
        methods,
        maskedEmail: user.email ? maskEmail(user.email) : '',
        maskedPhone: user.phone ? maskPhone(user.phone) : ''
      });
    }

    // STEP 2: Send OTP via chosen method
    if (!['email', 'phone'].includes(method)) {
      res.status(400);
      throw new Error('Invalid verification method chosen');
    }

    if (method === 'email' && !user.email) {
      res.status(400);
      throw new Error('Selected email method, but no email is linked to this account');
    }

    if (method === 'phone' && !user.phone) {
      res.status(400);
      throw new Error('Selected phone method, but no phone number is linked to this account');
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpireAt = new Date(Date.now() + (process.env.OTP_EXPIRE || 10) * 60000);

    user.otp = {
      code: otpCode,
      expireAt: otpExpireAt,
    };
    await user.save();

    const message = `Your Hamro Doctor password reset OTP is ${otpCode}. It expires in ${process.env.OTP_EXPIRE || 10} minutes.`;

    if (method === 'email') {
      // Print OTP in terminal
      console.log(`\n======================================================`);
      console.log(`[FORGOT PASSWORD OTP] Sent to Email (${user.email}): ${otpCode}`);
      console.log(`======================================================\n`);

      try {
        await sendEmail({
          email: user.email,
          subject: 'Hamro Doctor - Password Reset Code',
          message,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0D47A1;">Password Reset Verification</h2>
            <p>You requested to reset your password. Use the verification code below:</p>
            <div style="background-color: #EEF5FF; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #1E88E5; margin: 20px 0;">
              ${otpCode}
            </div>
            <p>This code will expire in ${process.env.OTP_EXPIRE || 10} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>`
        });
      } catch (mailErr) {
        console.error('SMTP Email dispatch failed:', mailErr.message);
        // Do not fail hard, proceed so development is not blocked
      }
    } else {
      // Print OTP in terminal
      console.log(`\n======================================================`);
      console.log(`[FORGOT PASSWORD OTP] Sent to Phone (${user.phone}): ${otpCode}`);
      console.log(`======================================================\n`);

      await sendSMS(user.phone, message);
    }

    res.status(200).json({
      success: true,
      step: 'send',
      message: `Password reset verification code sent via ${method}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password (using loginId instead of phone only)
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { loginId, code, newPassword } = req.body;

    if (!loginId || !code || !newPassword) {
      res.status(400);
      throw new Error('Please provide login ID, verification code, and new password');
    }

    const user = await User.findOne({
      $or: [{ email: loginId }, { phone: loginId }, { username: loginId }]
    });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.otp || user.otp.code !== code || user.otp.expireAt < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Update password
    user.password = newPassword;
    user.otp.code = undefined;
    user.otp.expireAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};


