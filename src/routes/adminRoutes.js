import express from 'express';
import { 
  getUsers, 
  approveUser, 
  onboardUser,
  getAdminArticles,
  deleteAdminArticle
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/approve/:id', approveUser);
router.post('/onboard', onboardUser);
router.get('/articles', getAdminArticles);
router.delete('/articles/:id', deleteAdminArticle);

export default router;
