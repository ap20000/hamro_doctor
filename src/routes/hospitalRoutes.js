import express from 'express';
import { 
  getHospitalDashboard, 
  manageHospitalDoctors, 
  getAppointments, 
  updateAppointmentStatus,
  updateHospitalProfile,
  getHospitalUsers,
  onboardHospitalUser,
  approveHospitalLink,
  getHospitalLinkRequests
} from '../controllers/hospitalController.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('hospital'));

/**
 * @swagger
 * /api/v1/hospital/dashboard:
 *   get:
 *     summary: Get hospital dashboard statistics
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', getHospitalDashboard);

/**
 * @swagger
 * /api/v1/hospital/doctors:
 *   post:
 *     summary: Add or update doctors in hospital
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.post('/doctors', manageHospitalDoctors);

/**
 * @swagger
 * /api/v1/hospital/appointments:
 *   get:
 *     summary: Get list of all appointments
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get('/appointments', getAppointments);

/**
 * @swagger
 * /api/v1/hospital/appointments/{id}:
 *   patch:
 *     summary: Update appointment status or add remarks
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/appointments/:id', updateAppointmentStatus);

/**
 * @swagger
 * /api/v1/hospital/profile:
 *   put:
 *     summary: Update hospital profile data
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', updateHospitalProfile);

/**
 * @swagger
 * /api/v1/hospital/users:
 *   get:
 *     summary: Get all users linked to this hospital (staff/doctors/patients)
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [doctor, patient, nurse]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/users', getHospitalUsers);

/**
 * @swagger
 * /api/v1/hospital/onboard:
 *   post:
 *     summary: Onboard user by Hospital
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, username, email, phone, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [doctor, patient, nurse]
 *     responses:
 *       201:
 *         description: User onboarded successfully
 */
router.post('/onboard', onboardHospitalUser);

/**
 * @swagger
 * /api/v1/hospital/link-requests:
 *   get:
 *     summary: Get hospital link requests from doctors
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/link-requests', getHospitalLinkRequests);

/**
 * @swagger
 * /api/v1/hospital/link-requests/{doctorId}:
 *   patch:
 *     summary: Approve or reject doctor link request
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the doctor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Doctor link request processed successfully
 */
router.patch('/link-requests/:doctorId', approveHospitalLink);

export default router;

