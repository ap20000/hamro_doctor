import express from 'express';
import { chatWithBot, getChatHistory, saveChatMessage } from '../controllers/chatbotController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chatbot interactions are secure and restricted to authenticated patients
router.use(protect);

router.post('/chat', chatWithBot);
router.get('/history', getChatHistory);
router.post('/save', saveChatMessage);

export default router;
