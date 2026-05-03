import express from 'express';
import { getDashboardStats, updateStatus, manageHospitals, getEarningsReport, updateProfile } from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

/**
 * @swagger
 * /api/v1/doctor/dashboard:
 *   get:
 *     summary: Get doctor dashboard statistics
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/v1/doctor/status:
 *   patch:
 *     summary: Update doctor online/offline status
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isOnline: {type: boolean}
 */
router.patch('/status', updateStatus);

/**
 * @swagger
 * /api/v1/doctor/hospitals:
 *   post:
 *     summary: Manage hospital affiliations and OPD times
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 */
router.post('/hospitals', manageHospitals);

/**
 * @swagger
 * /api/v1/doctor/earnings:
 *   get:
 *     summary: Get earnings and transaction report
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/earnings', getEarningsReport);

/**
 * @swagger
 * /api/v1/doctor/profile:
 *   put:
 *     summary: Update doctor profile details
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', updateProfile);

export default router;
