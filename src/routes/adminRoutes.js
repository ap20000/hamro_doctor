import express from 'express';
import { getUsers, approveUser, onboardUser } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/approve/:id', approveUser);
router.post('/onboard', onboardUser);

export default router;
