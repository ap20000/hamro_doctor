import express from 'express';
import { updateProfile, getBMI, getDoctors, updateAvatar, getHospitals, requestHospitalLink, getMyHospitals } from '../controllers/userController.js';
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
 * /api/v1/users/hospitals:
 *   get:
 *     summary: Get all approved hospitals
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/hospitals', getHospitals); // Get all approved hospitals

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

/**
 * @swagger
 * /api/v1/users/avatar:
 *   post:
 *     summary: Update profile avatar with compression
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64 encoded image string
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */
router.post('/avatar', protect, updateAvatar);

// Doctor specific route to request linking
/**
 * @swagger
 * /api/v1/users/my-hospitals:
 *   get:
 *     summary: Get hospitals the doctor is linked to or has requested to link to
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/my-hospitals', protect, getMyHospitals);

/**
 * @swagger
 * /api/v1/users/link-hospital:
 *   post:
 *     summary: Request to link doctor with a hospital
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hospitalId]
 *             properties:
 *               hospitalId:
 *                 type: string
 *                 description: MongoDB ObjectId of the hospital
 *     responses:
 *       200:
 *         description: Link request sent successfully
 */
router.post('/link-hospital', protect, requestHospitalLink);

export default router;
