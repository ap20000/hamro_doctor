import express from 'express';
import { getAdminStats, verifyInstitution, getRevenueReport } from '../controllers/adminController.js';
import { manageBlog, manageEvent, manageVideo, managePage } from '../controllers/contentController.js';
import { manageCoupon, manageBloodDonor, assignConsultation } from '../controllers/operationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', getAdminStats);

/**
 * @swagger
 * /api/v1/admin/institutions/{id}/verify:
 *   patch:
 *     summary: Verify/Approve Doctor or Hospital
 *     tags: [Admin]
 */
router.patch('/institutions/:id/verify', verifyInstitution);

/**
 * @swagger
 * /api/v1/admin/blogs:
 *   post:
 *     summary: Create or update a blog
 *     tags: [Admin - Content]
 */
router.post('/blogs', manageBlog);

/**
 * @swagger
 * /api/v1/admin/events:
 *   post:
 *     summary: Create or update an event
 *     tags: [Admin - Content]
 */
router.post('/events', manageEvent);

/**
 * @swagger
 * /api/v1/admin/pages:
 *   post:
 *     summary: Create or update static pages
 *     tags: [Admin - Content]
 */
router.post('/pages', managePage);

/**
 * @swagger
 * /api/v1/admin/coupons:
 *   post:
 *     summary: Manage discount coupons
 *     tags: [Admin - Operations]
 */
router.post('/coupons', manageCoupon);

/**
 * @swagger
 * /api/v1/admin/consultations/assign:
 *   post:
 *     summary: Assign consultation to a doctor
 *     tags: [Admin - Operations]
 */
router.post('/consultations/assign', assignConsultation);

export default router;
