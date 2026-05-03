import express from 'express';
import { askQuestion, answerQuestion, getQuestions } from '../controllers/forumController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/forum/questions:
 *   post:
 *     summary: Ask a public question
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 */
router.post('/questions', protect, askQuestion);

/**
 * @swagger
 * /api/v1/forum/questions/{id}/answer:
 *   post:
 *     summary: Answer a question (Doctor only)
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 */
router.post('/questions/:id/answer', protect, authorize('doctor'), answerQuestion);

/**
 * @swagger
 * /api/v1/forum/questions:
 *   get:
 *     summary: Get all forum questions
 *     tags: [Forum]
 */
router.get('/questions', getQuestions);

export default router;
