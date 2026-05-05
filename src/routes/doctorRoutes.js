import express from 'express';
import {
  getDashboardStats,
  updateStatus,
  getHospitals,
  addHospital,
  updateHospital,
  updateOpdTime,
  removeHospital,
  getEarningsReport,
  updateProfile
} from '../controllers/doctorController.js';
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
 *   get:
 *     summary: Get all workplace hospitals for the doctor
 *     tags: [Doctor - Hospitals]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Add a new workplace hospital with optional OPD schedule
 *     tags: [Doctor - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Norvic Hospital"
 *               address:
 *                 type: string
 *                 example: "Thapathali, Kathmandu"
 *               opdTime:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
 *                     startTime:
 *                       type: string
 *                       example: "10:00"
 *                     endTime:
 *                       type: string
 *                       example: "14:00"
 */
router.get('/hospitals', getHospitals);
router.post('/hospitals', addHospital);

/**
 * @swagger
 * /api/v1/doctor/hospitals/{hospitalId}:
 *   put:
 *     summary: Update hospital name, address, or full OPD schedule
 *     tags: [Doctor - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *   delete:
 *     summary: Remove a hospital from doctor's workplace list
 *     tags: [Doctor - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/hospitals/:hospitalId', updateHospital);
router.delete('/hospitals/:hospitalId', removeHospital);

/**
 * @swagger
 * /api/v1/doctor/hospitals/{hospitalId}/opd:
 *   put:
 *     summary: Update only the OPD schedule for a specific hospital
 *     tags: [Doctor - Hospitals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [opdTime]
 *             properties:
 *               opdTime:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [day, startTime, endTime]
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
 *                     startTime:
 *                       type: string
 *                       example: "09:00"
 *                     endTime:
 *                       type: string
 *                       example: "13:00"
 */
router.put('/hospitals/:hospitalId/opd', updateOpdTime);

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
