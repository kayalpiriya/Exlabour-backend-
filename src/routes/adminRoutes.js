import express from 'express';
import {
    getDashboardStats,
    getPendingUsers,
    verifyUser,
    getPendingTasks,
    approveTask,
    getAllUsers,
    getAllTasks,
    getAllBids,
    toggleBlockUser,
    getVerificationLogs,
        deleteUser // <-- 1. IMPORTED NEW FUNCTION

} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/pending-users', protect, authorize('admin'), getPendingUsers);
router.put('/verify-user/:id', protect, authorize('admin'), verifyUser);
router.get('/pending-tasks', protect, authorize('admin'), getPendingTasks);
router.put('/approve-task/:id', protect, authorize('admin'), approveTask);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/tasks', protect, authorize('admin'), getAllTasks);
router.get('/bids', protect, authorize('admin'), getAllBids);
router.put('/toggle-block/:id', protect, authorize('admin'), toggleBlockUser);
router.get('/verification-logs', protect, authorize('admin'), getVerificationLogs);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

export default router;