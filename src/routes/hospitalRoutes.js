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

router.get('/users', getHospitalUsers);
router.post('/onboard', onboardHospitalUser);
router.get('/link-requests', getHospitalLinkRequests);
router.patch('/link-requests/:doctorId', approveHospitalLink);

export default router;
