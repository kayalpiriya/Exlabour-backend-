import express from 'express';
import { getUserNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Only logged in users can see and modify their notifications
router.get('/', protect, getUserNotifications);
router.put('/:id/read', protect, markAsRead);

export default router;