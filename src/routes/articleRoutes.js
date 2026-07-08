import express from 'express';
import { createArticle, getArticles, getArticle } from '../controllers/articleController.js';
import { 
  addComment, 
  getComments, 
  toggleLikeArticle, 
  toggleDislikeArticle, 
  toggleLikeComment 
} from '../controllers/interactionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/articles:
 *   post:
 *     summary: Create new article
 *     tags: [Articles]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               featureImage:
 *                 type: string
 *                 description: Base64 data URL of the image
 *     responses:
 *       201:
 *         description: Article created successfully
 *   get:
 *     summary: Get all published articles
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/', protect, authorize('doctor'), createArticle);
router.get('/', getArticles);

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   get:
 *     summary: Get single article and increment views
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', getArticle);

/**
 * @swagger
 * /api/v1/articles/{id}/like:
 *   patch:
 *     summary: Like/Unlike an article
 *     tags: [Articles]
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
 *         description: Success
 */
router.patch('/:id/like', protect, toggleLikeArticle);

/**
 * @swagger
 * /api/v1/articles/{id}/dislike:
 *   patch:
 *     summary: Dislike/Undislike an article
 *     tags: [Articles]
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
 *         description: Success
 */
router.patch('/:id/dislike', protect, toggleDislikeArticle);

/**
 * @swagger
 * /api/v1/articles/{id}/comments:
 *   post:
 *     summary: Add comment to article
 *     tags: [Articles]
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
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *                 description: ID of parent comment if nesting
 *     responses:
 *       201:
 *         description: Comment created
 *   get:
 *     summary: Get comments for an article
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', getComments);

/**
 * @swagger
 * /api/v1/articles/comments/{id}/like:
 *   patch:
 *     summary: Like/Unlike a comment
 *     tags: [Articles]
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
 *         description: Success
 */
router.patch('/comments/:id/like', protect, toggleLikeComment);

export default router;

