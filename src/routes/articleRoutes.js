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

// Basic CRUD
router.post('/', protect, authorize('doctor'), createArticle);
router.get('/', getArticles);
router.get('/:id', getArticle);

// Interactions
router.patch('/:id/like', protect, toggleLikeArticle);
router.patch('/:id/dislike', protect, toggleDislikeArticle);

// Comments
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', getComments);
router.patch('/comments/:id/like', protect, toggleLikeComment);

export default router;
