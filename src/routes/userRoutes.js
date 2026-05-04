import express from 'express';
import { updateProfile, getBMI, getDoctors, updateAvatar } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/users/doctors:
 *   get:
 *     summary: Get all available doctors with filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: speciality
 *         schema:
 *           type: string
 *       - in: query
 *         name: isOnline
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/doctors', getDoctors);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: {type: string}
 *               profile:
 *                 type: object
 *                 properties:
 *                   gender: {type: string, enum: [Male, Female, Other]}
 *                   address: {type: string}
 *                   bmi:
 *                     type: object
 *                     properties:
 *                       height: {type: number, description: "in cm"}
 *                       weight: {type: number, description: "in kg"}
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/v1/users/bmi:
 *   get:
 *     summary: Get user BMI metrics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns BMI data
 */
router.get('/bmi', protect, getBMI);
router.post('/avatar', protect, updateAvatar);

export default router;
