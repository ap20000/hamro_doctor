import express from 'express';
import { 
  startConsultation, 
  startCallSession,
  finishCallSession,
  getMyConsultations, 
  requestConsultation, 
  respondToConsultation,
  getConsultationById,
  completeConsultation
} from '../controllers/consultationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/v1/consultations/request:
 *   post:
 *     summary: Request a consultation (Patient)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId]
 *             properties:
 *               doctorId: {type: string}
 *     responses:
 *       201:
 *         description: Request sent
 */
router.post('/request', requestConsultation);

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
 * /api/v1/consultations/{id}/session/{sessionId}/finish:
 *   patch:
 *     summary: Finish call session (updates actual end time)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consultation ID
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session finished
 */
router.patch('/:id/session/:sessionId/finish', finishCallSession);

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

/**
 * @swagger
 * /api/v1/consultations/{id}/respond:
 *   patch:
 *     summary: Respond to consultation request (Doctor)
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
 *             required: [status]
 *             properties:
 *               status: {type: string, enum: [active, cancelled]}
 *     responses:
 *       200:
 *         description: Responded successfully
 */
router.patch('/:id/respond', respondToConsultation);

/**
 * @swagger
 * /api/v1/consultations/{id}/complete:
 *   patch:
 *     summary: Complete consultation manually (Doctor only)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consultation completed successfully
 */
router.patch('/:id/complete', completeConsultation);

/**
 * @swagger
 * /api/v1/consultations/{id}:
 *   get:
 *     summary: Get single consultation details by ID
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', getConsultationById);

export default router;

