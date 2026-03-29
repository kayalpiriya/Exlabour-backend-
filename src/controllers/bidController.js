// import Bid from '../models/Bid.js';
// import Task from '../models/Task.js';

// // @desc    Place a bid on a task
// // @route   POST /api/bids/:taskId
// // @access  Private (Tasker only)
// export const placeBid = async (req, res) => {
//     try {
//         const { bidAmount, deliveryDays, proposalMessage } = req.body;
//         const taskId = req.params.taskId;

//         // Validation
//         if (!bidAmount || !deliveryDays || !proposalMessage) {
//             return res.status(400).json({ message: 'Please fill all bid fields' });
//         }

//         // Check if task exists and is open
//         const task = await Task.findById(taskId);
//         if (!task) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         if (task.approvalStatus !== 'approved' || task.taskStatus !== 'open_for_bidding') {
//             return res.status(400).json({ message: 'Task is not open for bidding' });
//         }

//         // Check if tasker is verified
//         if (req.user.verificationStatus !== 'verified') {
//             return res.status(403).json({ message: 'You must be verified to place bids' });
//         }

//         // Check for duplicate bid
//         const existingBid = await Bid.findOne({
//             taskId,
//             taskerId: req.user._id,
//             bidStatus: { $ne: 'withdrawn' }
//         });

//         if (existingBid) {
//             return res.status(400).json({ message: 'You already have an active bid on this task' });
//         }

//         const bid = await Bid.create({
//             taskId,
//             taskerId: req.user._id,
//             bidAmount,
//             deliveryDays,
//             proposalMessage
//         });

//         res.status(201).json(bid);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Get all bids for a specific task
// // @route   GET /api/bids/task/:taskId
// // @access  Private (Task owner or Admin)
// export const getBidsForTask = async (req, res) => {
//     try {
//         const task = await Task.findById(req.params.taskId);
//         if (!task) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         // Only task owner or admin can see all bids
//         if (task.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Not authorized to view these bids' });
//         }

//         const bids = await Bid.find({ taskId: req.params.taskId })
//             .populate('taskerId', 'name email profileImage phone')
//             .sort({ createdAt: -1 });

//         res.status(200).json(bids);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Get bids placed by logged-in tasker
// // @route   GET /api/bids/my-bids
// // @access  Private (Tasker only)
// export const getMyBids = async (req, res) => {
//     try {
//         const bids = await Bid.find({ taskerId: req.user._id })
//             .populate('taskId', 'title taskStatus budgetMin budgetMax deadline')
//             .sort({ createdAt: -1 });

//         res.status(200).json(bids);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Update a bid
// // @route   PUT /api/bids/:bidId
// // @access  Private (Tasker who owns the bid)
// export const updateBid = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.bidId);
//         if (!bid) {
//             return res.status(404).json({ message: 'Bid not found' });
//         }

//         if (bid.taskerId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Not authorized to update this bid' });
//         }

//         if (bid.bidStatus !== 'pending') {
//             return res.status(400).json({ message: 'Can only update pending bids' });
//         }

//         const { bidAmount, deliveryDays, proposalMessage } = req.body;
//         if (bidAmount) bid.bidAmount = bidAmount;
//         if (deliveryDays) bid.deliveryDays = deliveryDays;
//         if (proposalMessage) bid.proposalMessage = proposalMessage;

//         await bid.save();
//         res.status(200).json(bid);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Withdraw a bid
// // @route   PUT /api/bids/:bidId/withdraw
// // @access  Private (Tasker who owns the bid)
// export const withdrawBid = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.bidId);
//         if (!bid) {
//             return res.status(404).json({ message: 'Bid not found' });
//         }

//         if (bid.taskerId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Not authorized' });
//         }

//         if (bid.bidStatus !== 'pending') {
//             return res.status(400).json({ message: 'Can only withdraw pending bids' });
//         }

//         bid.bidStatus = 'withdrawn';
//         await bid.save();

//         res.status(200).json({ message: 'Bid withdrawn successfully', bid });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Accept a bid and assign task
// // @route   PUT /api/bids/:bidId/accept
// // @access  Private (User who owns the task)
// export const acceptBid = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.bidId);
//         if (!bid) {
//             return res.status(404).json({ message: 'Bid not found' });
//         }

//         const task = await Task.findById(bid.taskId);
//         if (!task) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         // Only task owner can accept bids
//         if (task.userId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Not authorized to accept bids on this task' });
//         }

//         // Task must be open for bidding
//         if (task.taskStatus !== 'open_for_bidding') {
//             return res.status(400).json({ message: 'Task is no longer open for bidding' });
//         }

//         // Accept this bid
//         bid.bidStatus = 'accepted';
//         await bid.save();

//         // Reject all other pending bids on this task
//         await Bid.updateMany(
//             { taskId: task._id, _id: { $ne: bid._id }, bidStatus: 'pending' },
//             { bidStatus: 'rejected' }
//         );

//         // Assign task to the tasker
//         task.taskStatus = 'assigned';
//         task.assignedTaskerId = bid.taskerId;
//         await task.save();

//         res.status(200).json({
//             message: 'Bid accepted and task assigned successfully',
//             task,
//             acceptedBid: bid
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // @desc    Reject a single bid
// // @route   PUT /api/bids/:bidId/reject
// // @access  Private (User who owns the task)
// export const rejectBid = async (req, res) => {
//     try {
//         const bid = await Bid.findById(req.params.bidId);
//         if (!bid) {
//             return res.status(404).json({ message: 'Bid not found' });
//         }

//         const task = await Task.findById(bid.taskId);
//         if (!task) {
//             return res.status(404).json({ message: 'Task not found' });
//         }

//         if (task.userId.toString() !== req.user._id.toString()) {
//             return res.status(403).json({ message: 'Not authorized' });
//         }

//         if (bid.bidStatus !== 'pending') {
//             return res.status(400).json({ message: 'Can only reject pending bids' });
//         }

//         bid.bidStatus = 'rejected';
//         await bid.save();

//         res.status(200).json({ message: 'Bid rejected successfully', bid });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };



import Bid from '../models/Bid.js';
import Task from '../models/Task.js';
import { sendNotification } from '../utils/notificationHelper.js';

// ==================== Tasker APIs ====================

// @desc    Place a bid on a task
// @route   POST /api/bids/:taskId
// @access  Private (Tasker only)
export const placeBid = async (req, res) => {
    try {
        const { bidAmount, deliveryDays, proposalMessage } = req.body;
        const taskId = req.params.taskId;

        if (!bidAmount || !deliveryDays || !proposalMessage) {
            return res.status(400).json({ message: 'Please fill all bid fields' });
        }

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.approvalStatus !== 'approved' || task.taskStatus !== 'open_for_bidding') {
            return res.status(400).json({ message: 'Task is not open for bidding' });
        }

        if (req.user.verificationStatus !== 'verified') {
            return res.status(403).json({ message: 'You must be verified to place bids' });
        }

        const existingBid = await Bid.findOne({
            taskId,
            taskerId: req.user._id,
            bidStatus: { $ne: 'withdrawn' }
        });

        if (existingBid) return res.status(400).json({ message: 'You already have an active bid on this task' });

        const bid = await Bid.create({
            taskId,
            taskerId: req.user._id,
            bidAmount,
            deliveryDays,
            proposalMessage
        });

        // Notify the task owner about the new bid
        try {
            await sendNotification({
                userId: task.userId,
                title: 'New Bid Received',
                message: `You received a new bid of $${bidAmount} from ${req.user.name} for your task.`,
                type: 'bidding',
                relatedId: task._id
            });
        } catch (notifErr) {
            console.error('Notification error on bidding:', notifErr.message);
        }

        res.status(201).json(bid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bids placed by logged-in tasker
// @route   GET /api/bids/my-bids
// @access  Private (Tasker only)
export const getMyBids = async (req, res) => {
    try {
        const bids = await Bid.find({ taskerId: req.user._id })
            .populate('taskId', 'title taskStatus budgetMin budgetMax deadline')
            .sort({ createdAt: -1 });

        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a bid
// @route   PUT /api/bids/:bidId
// @access  Private (Tasker who owns the bid)
export const updateBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        if (bid.taskerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this bid' });
        }

        if (bid.bidStatus !== 'pending') {
            return res.status(400).json({ message: 'Can only update pending bids' });
        }

        const { bidAmount, deliveryDays, proposalMessage } = req.body;
        if (bidAmount) bid.bidAmount = bidAmount;
        if (deliveryDays) bid.deliveryDays = deliveryDays;
        if (proposalMessage) bid.proposalMessage = proposalMessage;

        await bid.save();
        res.status(200).json(bid);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Withdraw a bid
// @route   PUT /api/bids/:bidId/withdraw
// @access  Private (Tasker who owns the bid)
export const withdrawBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        if (bid.taskerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (bid.bidStatus !== 'pending') {
            return res.status(400).json({ message: 'Can only withdraw pending bids' });
        }

        bid.bidStatus = 'withdrawn';
        await bid.save();

        res.status(200).json({ message: 'Bid withdrawn successfully', bid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== User APIs ====================

// @desc    Get all bids for a specific task (task owner or admin)
// @route   GET /api/bids/task/:taskId
// @access  Private (Task owner or Admin)
export const getBidsForTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view these bids' });
        }

        const bids = await Bid.find({ taskId: req.params.taskId })
            .populate('taskerId', 'name email profileImage phone')
            .sort({ createdAt: -1 });

        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bids for all tasks posted by logged-in user
// @route   GET /api/bids/user/all-bids
// @access  Private (User)
export const getAllBidsForUser = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id }).select('_id title');
        const taskIds = tasks.map(task => task._id);

        const bids = await Bid.find({ taskId: { $in: taskIds } })
            .populate('taskerId', 'name email profileImage phone')
            .populate('taskId', 'title taskStatus')
            .sort({ createdAt: -1 });

        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept a bid and assign task
// @route   PUT /api/bids/:bidId/accept
// @access  Private (User who owns the task)
export const acceptBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        const task = await Task.findById(bid.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept bids' });
        }

        if (task.taskStatus !== 'open_for_bidding') {
            return res.status(400).json({ message: 'Task is no longer open for bidding' });
        }

        bid.bidStatus = 'accepted';
        await bid.save();

        // Reject all other pending bids
        await Bid.updateMany(
            { taskId: task._id, _id: { $ne: bid._id }, bidStatus: 'pending' },
            { bidStatus: 'rejected' }
        );

        task.taskStatus = 'assigned';
        task.assignedTaskerId = bid.taskerId;
        await task.save();

        // Notify the tasker that their bid was accepted
        try {
            await sendNotification({
                userId: bid.taskerId,
                title: 'Bid Accepted!',
                message: `Your bid for the task "${task.title}" has been accepted!`,
                type: 'bid_acceptance',
                relatedId: task._id
            });
        } catch (notifErr) {
            console.error('Notification error on bid acceptance:', notifErr.message);
        }

        res.status(200).json({
            message: 'Bid accepted and task assigned successfully',
            task,
            acceptedBid: bid
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a single bid
// @route   PUT /api/bids/:bidId/reject
// @access  Private (User who owns the task)
export const rejectBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        const task = await Task.findById(bid.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (bid.bidStatus !== 'pending') {
            return res.status(400).json({ message: 'Can only reject pending bids' });
        }

        bid.bidStatus = 'rejected';
        await bid.save();

        res.status(200).json({ message: 'Bid rejected successfully', bid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================== Admin API ====================

// @desc    Get all bids in system
// @route   GET /api/bids
// @access  Private (Admin only)
export const getAllBids = async (req, res) => {
    try {
        const bids = await Bid.find()
            .populate('taskId', 'title userId taskStatus')
            .populate('taskerId', 'name email profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};