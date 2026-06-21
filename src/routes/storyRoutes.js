import express from 'express';
import { getStories, createStory, getRecommendations, getMyStories, deleteStory } from '../controllers/storyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/stories:
 *   get:
 *     summary: Get all active health stories (last 24 hours)
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: Returns list of active stories
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
 * /api/v1/stories/my-stories:
 *   get:
 *     summary: Get current doctor's stories (active and archived)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of doctor's stories
 */
router.get('/my-stories', protect, authorize('doctor'), getMyStories);

/**
 * @swagger
 * /api/v1/stories/{id}:
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
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
 *         description: Story deleted
 */
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteStory);

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
