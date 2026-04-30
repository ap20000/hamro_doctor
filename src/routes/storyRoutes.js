import express from 'express';
import { getStories, createStory, getRecommendations } from '../controllers/storyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/stories:
 *   get:
 *     summary: Get all health stories
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: Returns list of stories
 */
router.get('/', getStories);

/**
 * @swagger
 * /api/v1/stories:
 *   post:
 *     summary: Create a health story (Doctor/Admin only)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: {type: string}
 *               content: {type: string}
 *               image: {type: string}
 *               category: {type: string, enum: [Health Tips, Medical News, Success Story, Other]}
 *     responses:
 *       201:
 *         description: Story created
 */
router.post('/', protect, authorize('doctor', 'admin'), createStory);

/**
 * @swagger
 * /api/v1/stories/recommendations:
 *   get:
 *     summary: Get recommended stories for current user
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of recommendations
 */
router.get('/recommendations', protect, getRecommendations);

export default router;
