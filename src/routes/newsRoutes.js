import express from 'express';
import { 
  createNews, 
  getNews, 
  addComment, 
  moderateComment 
} from '../controllers/newsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/news:
 *   get:
 *     summary: Get all published news
 *     tags: [News]
 */
router.get('/', getNews);

/**
 * @swagger
 * /api/v1/news:
 *   post:
 *     summary: Create news (Admin/Doctor only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, authorize('admin', 'doctor'), createNews);

/**
 * @swagger
 * /api/v1/news/{id}/comments:
 *   post:
 *     summary: Add a comment to news
 *     tags: [News]
 */
router.post('/:id/comments', addComment);

/**
 * @swagger
 * /api/v1/news/{id}/comments/{commentId}:
 *   patch:
 *     summary: Moderate a comment (Admin only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/comments/:commentId', protect, authorize('admin'), moderateComment);

export default router;
