import express from 'express';
import { createArticle, getArticles, getArticle } from '../controllers/articleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/articles:
 *   post:
 *     summary: Write a new article (Doctor only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', protect, authorize('doctor'), createArticle);

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Get all published articles
 *     tags: [Articles]
 */
router.get('/', getArticles);

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   get:
 *     summary: Get single article details
 *     tags: [Articles]
 */
router.get('/:id', getArticle);

export default router;
