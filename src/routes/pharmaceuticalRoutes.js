import express from 'express';
import { 
  getPharmaDashboard, 
  manageMedicine, 
  getMyMedicines, 
  boostPharma,
  subscribe 
} from '../controllers/pharmaceuticalController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('pharmaceutical'));

/**
 * @swagger
 * /api/v1/pharmaceutical/dashboard:
 *   get:
 *     summary: Get pharmaceutical dashboard statistics
 *     tags: [Pharmaceutical]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', getPharmaDashboard);

/**
 * @swagger
 * /api/v1/pharmaceutical/medicines:
 *   post:
 *     summary: Add or update a medicine brand
 *     tags: [Pharmaceutical]
 *     security:
 *       - bearerAuth: []
 */
router.post('/medicines', manageMedicine);

/**
 * @swagger
 * /api/v1/pharmaceutical/medicines:
 *   get:
 *     summary: List all medicines owned by the pharmaceutical
 *     tags: [Pharmaceutical]
 *     security:
 *       - bearerAuth: []
 */
router.get('/medicines', getMyMedicines);

/**
 * @swagger
 * /api/v1/pharmaceutical/boost:
 *   post:
 *     summary: Boost pharmaceutical profile visibility
 *     tags: [Pharmaceutical]
 *     security:
 *       - bearerAuth: []
 */
router.post('/boost', boostPharma);

/**
 * @swagger
 * /api/v1/pharmaceutical/subscribe:
 *   post:
 *     summary: Activate or renew annual subscription
 *     tags: [Pharmaceutical]
 *     security:
 *       - bearerAuth: []
 */
router.post('/subscribe', subscribe);

export default router;
