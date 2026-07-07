import express from 'express';
import { extractTextController, detectController } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/analysis/ocr:
 *   post:
 *     summary: Extract text from uploaded document or image
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
 *         description: Extracted text
 *       204:
 *         description: No text extracted
 */
router.post('/ocr', protect, upload.single('file'), extractTextController);

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

export default router;
