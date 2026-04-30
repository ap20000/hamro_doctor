import express from 'express';
import { addRecord, getMyRecords, shareRecord } from '../controllers/recordController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/v1/records:
 *   post:
 *     summary: Add a medical record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, fileUrl]
 *             properties:
 *               title: {type: string}
 *               description: {type: string}
 *               fileUrl: {type: string}
 *               fileType: {type: string, enum: [pdf, jpeg, png]}
 *               recordType: {type: string, enum: [Report, Prescription, Lab Result, Other]}
 *     responses:
 *       201:
 *         description: Record added
 */
router.post('/', addRecord);

/**
 * @swagger
 * /api/v1/records:
 *   get:
 *     summary: Get all my medical records
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of records
 */
router.get('/', getMyRecords);

/**
 * @swagger
 * /api/v1/records/{id}/share:
 *   post:
 *     summary: Share record with a doctor
 *     tags: [Records]
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
 *             required: [doctorId, durationInHours]
 *             properties:
 *               doctorId: {type: string}
 *               durationInHours: {type: number}
 *     responses:
 *       200:
 *         description: Record shared successfully
 */
router.post('/:id/share', shareRecord);

export default router;
