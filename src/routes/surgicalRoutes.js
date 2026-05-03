import express from 'express';
import { 
  getSurgicalDashboard, 
  manageProduct, 
  getMyOrders, 
  boostSurgical,
  subscribe 
} from '../controllers/surgicalController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('surgical'));

/**
 * @swagger
 * /api/v1/surgical/dashboard:
 *   get:
 *     summary: Get surgical distributor dashboard statistics
 *     tags: [Surgical]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', getSurgicalDashboard);

/**
 * @swagger
 * /api/v1/surgical/products:
 *   post:
 *     summary: Add or update a surgical product
 *     tags: [Surgical]
 *     security:
 *       - bearerAuth: []
 */
router.post('/products', manageProduct);

/**
 * @swagger
 * /api/v1/surgical/orders:
 *   get:
 *     summary: List all orders for the distributor
 *     tags: [Surgical]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders', getMyOrders);

/**
 * @swagger
 * /api/v1/surgical/boost:
 *   post:
 *     summary: Boost surgical distributor profile visibility
 *     tags: [Surgical]
 *     security:
 *       - bearerAuth: []
 */
router.post('/boost', boostSurgical);

/**
 * @swagger
 * /api/v1/surgical/subscribe:
 *   post:
 *     summary: Activate or renew annual subscription
 *     tags: [Surgical]
 *     security:
 *       - bearerAuth: []
 */
router.post('/subscribe', subscribe);

export default router;
