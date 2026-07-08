import express from 'express';
import { detectController, visionOcrController } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();



/**
 * @swagger
 * /api/v1/analysis/detect:
 *   post:
 *     summary: Extract text and detect diseases and medicines
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Detected diseases and medicines
 *       204:
 *         description: No entities detected
 */
router.post('/detect', protect, upload.single('file'), detectController);

/**
 * @swagger
 * /api/v1/analysis/vision-ocr:
 *   post:
 *     summary: Extract text from an uploaded image using OpenRouter Vision
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to transcribe
 *     responses:
 *       200:
 *         description: Extracted text
 *       400:
 *         description: Invalid file format (images only)
 */
router.post('/vision-ocr', protect, upload.single('file'), visionOcrController);

export default router;
