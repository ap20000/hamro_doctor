import express from 'express';
import { createPrescription, getMyPrescriptions } from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/v1/prescriptions:
 *   post:
 *     summary: Create a prescription (Doctor only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consultationId, patientId, diagnosis, medicines]
 *             properties:
 *               consultationId: {type: string}
 *               patientId: {type: string}
 *               diagnosis: {type: string}
 *               medicines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: {type: string}
 *                     dosage: {type: string}
 *                     frequency: {type: string}
 *                     duration: {type: string}
 *                     instruction: {type: string}
 *               advice: {type: string}
 *     responses:
 *       201:
 *         description: Prescription created
 */
router.post('/', authorize('doctor'), createPrescription);

/**
 * @swagger
 * /api/v1/prescriptions:
 *   get:
 *     summary: Get my prescriptions
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of prescriptions
 */
router.get('/', getMyPrescriptions);

export default router;
