import express from 'express';
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    completeTask,
    updateTaskProgress
} from '../controllers/taskController.js';
import { protect, authorize } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post('/', protect, authorize('user'), upload.array('attachments', 5), createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, authorize('user'), upload.array('attachments', 5), updateTask);
router.delete('/:id', protect, authorize('user'), deleteTask);
router.put('/:id/complete', protect, authorize('user'), completeTask);
router.put('/:id/progress', protect, authorize('tasker'), updateTaskProgress);

export default router;