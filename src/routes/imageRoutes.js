import express from 'express';
import {
  uploadImage,
  getMyImages,
  getImageById,
  viewImageFromDb,
  deleteImage,
} from '../controllers/imageController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All image routes require authentication (user-wise)
router.use(protect);

/**
 * @swagger
 * /api/v1/images/upload:
 *   post:
 *     summary: Upload an image and store it user-wise in the database
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64 encoded image string
 *     responses:
 *       201:
 *         description: Image stored in database successfully
 *       400:
 *         description: No image provided
 */
router.post('/upload', upload.any(), uploadImage);

/**
 * @swagger
 * /api/v1/images:
 *   post:
 *     summary: Upload an image and store it user-wise in the database (alias for /upload)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image stored in database successfully
 */
router.post('/', upload.any(), uploadImage);

/**
 * @swagger
 * /api/v1/images:
 *   get:
 *     summary: Get all uploaded images from database for current user
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user images with direct view URLs
 */
router.get('/', getMyImages);

/**
 * @swagger
 * /api/v1/images/{id}:
 *   get:
 *     summary: Get a specific image document (including Base64 imageData) by ID
 *     tags: [Images]
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
 *         description: Image retrieved successfully
 *       403:
 *         description: Not authorized to access this image
 *       404:
 *         description: Image not found
 */
router.get('/:id', getImageById);

/**
 * @swagger
 * /api/v1/images/{id}/view:
 *   get:
 *     summary: Directly render and view binary image from the database
 *     description: Returns the raw image stream from MongoDB. Can be visited directly in a browser or used as an img src tag (can pass token via query parameter ?token=xxx).
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional JWT token for direct browser or img src access
 *     responses:
 *       200:
 *         description: Binary image stream rendered
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/view', viewImageFromDb);

/**
 * @swagger
 * /api/v1/images/{id}:
 *   delete:
 *     summary: Delete an image from the database
 *     tags: [Images]
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
 *         description: Image deleted successfully
 */
router.delete('/:id', deleteImage);

export default router;
