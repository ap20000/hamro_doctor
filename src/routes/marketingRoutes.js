import express from 'express';
import { 
  createCampaign, 
  getCampaigns, 
  manageAd, 
  getAds, 
  trackAdView 
} from '../controllers/marketingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for tracking
/**
 * @swagger
 * /api/v1/marketing/ads/{id}/track:
 *   get:
 *     summary: Track an advertisement view/impression
 *     tags: [Marketing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the advertisement
 *     responses:
 *       200:
 *         description: Tracked successfully
 */
router.get('/ads/:id/track', trackAdView);

// Admin routes

router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/marketing/campaigns:
 *   post:
 *     summary: Create a mass marketing campaign (Email, SMS, Push)
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 */
router.post('/campaigns', createCampaign);

/**
 * @swagger
 * /api/v1/marketing/campaigns:
 *   get:
 *     summary: List all campaigns and their stats
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/campaigns', getCampaigns);

/**
 * @swagger
 * /api/v1/marketing/ads:
 *   post:
 *     summary: Create or update an advertisement
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 */
router.post('/ads', manageAd);

/**
 * @swagger
 * /api/v1/marketing/ads:
 *   get:
 *     summary: List active advertisements
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 */
router.get('/ads', getAds);

export default router;
