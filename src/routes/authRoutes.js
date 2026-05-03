import express from 'express';
import passport from 'passport';
import { register, login, verifyOtp, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { generateToken } from '../utils/generateToken.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, password]
 *             properties:
 *               name: {type: string}
 *               email: {type: string}
 *               phone: {type: string}
 *               password: {type: string}
 *               role: {type: string, enum: [patient, doctor]}
 *     responses:
 *       201:
 *         description: User registered
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone: {type: string}
 *               code: {type: string}
 *     responses:
 *       200:
 *         description: OTP verified, returns token
 */
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [loginId, password]
 *             properties:
 *               loginId: {type: string, description: "Email or Phone"}
 *               password: {type: string}
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user data
 */
router.get('/me', protect, getMe);

// --- Social Login Routes ---

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Google Login
 *     tags: [Auth]
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google Auth Callback
 *     tags: [Auth]
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user._id);
    // In production, redirect to frontend with token
    res.json({
      success: true,
      token,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

/**
 * @swagger
 * /api/v1/auth/facebook:
 *   get:
 *     summary: Facebook Login
 *     tags: [Auth]
 */
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * @swagger
 * /api/v1/auth/facebook/callback:
 *   get:
 *     summary: Facebook Auth Callback
 *     tags: [Auth]
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

/**
 * @swagger
 * /api/v1/auth/upload-docs:
 *   post:
 *     summary: Upload doctor documents (Avatar/Council Doc)
 *     tags: [Auth]
 */
router.post('/upload-docs', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'councilDocument', maxCount: 1 }
]), (req, res) => {
  const files = {};
  if (req.files.avatar) files.avatar = req.files.avatar[0].path;
  if (req.files.councilDocument) files.councilDocument = req.files.councilDocument[0].path;

  res.json({
    success: true,
    files
  });
});

export default router;
