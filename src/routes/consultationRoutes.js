import express from 'express';
import { startConsultation, startCallSession, getMyConsultations } from '../controllers/consultationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/v1/consultations/start:
 *   post:
 *     summary: Start a consultation (after payment)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, amount]
 *             properties:
 *               doctorId: {type: string}
 *               amount: {type: number}
 *     responses:
 *       201:
 *         description: Consultation started
 */
router.post('/start', startConsultation);

/**
 * @swagger
 * /api/v1/consultations/{id}/session:
 *   post:
 *     summary: Start a call session (15 mins)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type: {type: string, enum: [audio, video]}
 *     responses:
 *       200:
 *         description: Session started
 */
router.post('/:id/session', startCallSession);

/**
 * @swagger
 * /api/v1/consultations:
 *   get:
 *     summary: Get my consultation history
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of consultations
 */
router.get('/', getMyConsultations);

export default router;
