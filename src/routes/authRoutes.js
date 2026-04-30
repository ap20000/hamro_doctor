import express from 'express';
import { register, login, verifyOtp, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

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

export default router;
