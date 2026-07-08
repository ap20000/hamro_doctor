import express from 'express';
import { chatWithBot, getChatHistory, saveChatMessage } from '../controllers/chatbotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chatbot interactions are secure and restricted to authenticated patients
router.use(protect);

/**
 * @swagger
 * /api/v1/chatbot/chat:
 *   post:
 *     summary: Chat with AI bot receptionist
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: "What is the normal blood pressure range?"
 *     responses:
 *       200:
 *         description: Bot reply returned
 */
router.post('/chat', chatWithBot);

/**
 * @swagger
 * /api/v1/chatbot/history:
 *   get:
 *     summary: Get chat history
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of previous messages
 */
router.get('/history', getChatHistory);

/**
 * @swagger
 * /api/v1/chatbot/save:
 *   post:
 *     summary: Manually save messages to chat history
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userMessage:
 *                 type: string
 *               botReply:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message logs saved
 */
router.post('/save', saveChatMessage);

export default router;
