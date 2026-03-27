import express from 'express';
import {
    placeBid,
    getBidsForTask,
    getMyBids,
    updateBid,
    withdrawBid,
    acceptBid,
    rejectBid,
    getAllBidsForUser
} from '../controllers/bidController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/:taskId', protect, authorize('tasker'), placeBid);
router.get('/task/:taskId', protect, getBidsForTask);
router.get('/my-bids', protect, authorize('tasker'), getMyBids);
router.put('/:bidId', protect, authorize('tasker'), updateBid);
router.put('/:bidId/withdraw', protect, authorize('tasker'), withdrawBid);
router.put('/:bidId/accept', protect, authorize('user'), acceptBid);
router.put('/:bidId/reject', protect, authorize('user'), rejectBid);
router.get('/user/all-bids', protect, authorize('user'), getAllBidsForUser);
export default router;