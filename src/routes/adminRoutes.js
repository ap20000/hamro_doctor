import express from 'express';
import { 
  getUsers, 
  approveUser, 
  onboardUser,
  getAdminArticles,
  deleteAdminArticle,
  getAdminStories,
  deleteAdminStory
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [patient, doctor, hospital, admin]
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/users', getUsers);

/**
 * @swagger
 * /api/v1/admin/approve/{id}:
 *   put:
 *     summary: Approve/Reject doctor or hospital user
 *     tags: [Admin]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: true to approve, false to reject
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.put('/approve/:id', approveUser);

/**
 * @swagger
 * /api/v1/admin/onboard:
 *   post:
 *     summary: Create user by Admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [patient, doctor, hospital, admin]
 *     responses:
 *       201:
 *         description: User onboarded successfully
 */
router.post('/onboard', onboardUser);

/**
 * @swagger
 * /api/v1/admin/articles:
 *   get:
 *     summary: Get all articles with search (by title or doctor name)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for title or author name
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/articles', getAdminArticles);

/**
 * @swagger
 * /api/v1/admin/articles/{id}:
 *   delete:
 *     summary: Delete article and associated comments by Admin
 *     tags: [Admin]
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
 *         description: Article deleted
 */
router.delete('/articles/:id', deleteAdminArticle);

/**
 * @swagger
 * /api/v1/admin/stories:
 *   get:
 *     summary: Get all stories
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stories', getAdminStories);

/**
 * @swagger
 * /api/v1/admin/stories/{id}:
 *   delete:
 *     summary: Delete story by Admin
 *     tags: [Admin]
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
 *         description: Story deleted
 */
router.delete('/stories/:id', deleteAdminStory);

export default router;

