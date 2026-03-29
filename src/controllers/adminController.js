import User from '../models/User.js';
import Task from '../models/Task.js';
import Bid from '../models/Bid.js';
import VerificationLog from '../models/VerificationLog.js';
import { sendNotification, broadcastNotification } from '../utils/notificationHelper.js';

// @desc    Get admin dashboard summary
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalTaskers = await User.countDocuments({ role: 'tasker' });
        const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending' });
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ approvalStatus: 'pending_admin_approval' });
        const activeTasks = await Task.countDocuments({ approvalStatus: 'approved' });
        const totalBids = await Bid.countDocuments();
        const completedTasks = await Task.countDocuments({ taskStatus: 'completed' });

        res.status(200).json({
            totalUsers,
            totalTaskers,
            pendingVerifications,
            totalTasks,
            pendingTasks,
            activeTasks,
            totalBids,
            completedTasks
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending users and taskers
// @route   GET /api/admin/pending-users
// @access  Private (Admin only)
export const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            verificationStatus: 'pending',
            role: { $in: ['user', 'tasker'] }
        }).select('-password').sort({ createdAt: -1 });

        res.status(200).json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify or reject a user/tasker
// @route   PUT /api/admin/verify-user/:id
// @access  Private (Admin only)
export const verifyUser = async (req, res) => {
    try {
        const { decision, remarks } = req.body;

        const validDecisions = ['verified', 'rejected', 'blocked'];
        if (!validDecisions.includes(decision)) {
            return res.status(400).json({
                message: 'Invalid decision. Must be verified, rejected, or blocked'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot modify admin accounts' });
        }

        user.verificationStatus = decision;
        if (decision === 'blocked') {
            user.isActive = false;
        }
        if (decision === 'verified') {
            user.isActive = true;
        }
        await user.save();

        // Create verification log
        await VerificationLog.create({
            targetId: user._id,
            targetType: 'User',
            reviewedBy: req.user._id,
            decision,
            remarks: remarks || ''
        });

        // Notify User/Tasker about verification decision
        try {
            await sendNotification({
                userId: user._id,
                title: 'Account Verification Update',
                message: `Your account status has been updated to ${decision}.`,
                type: 'verification',
                relatedId: user._id
            });
        } catch (notifErr) {
            console.error('Notification error on verification:', notifErr.message);
        }

        res.status(200).json({
            message: `User ${decision} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verificationStatus: user.verificationStatus,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all tasks pending admin approval
// @route   GET /api/admin/pending-tasks
// @access  Private (Admin only)
export const getPendingTasks = async (req, res) => {
    try {
        const pendingTasks = await Task.find({
            approvalStatus: 'pending_admin_approval'
        })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(pendingTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject a task
// @route   PUT /api/admin/approve-task/:id
// @access  Private (Admin only)
export const approveTask = async (req, res) => {
    try {
        const { decision, remarks } = req.body;

        const validDecisions = ['approved', 'rejected'];
        if (!validDecisions.includes(decision)) {
            return res.status(400).json({
                message: 'Invalid decision. Must be approved or rejected'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.approvalStatus = decision;
        if (decision === 'approved') {
            task.taskStatus = 'open_for_bidding';
        }
        await task.save();

        // Create verification log
        await VerificationLog.create({
            targetId: task._id,
            targetType: 'Task',
            reviewedBy: req.user._id,
            decision,
            remarks: remarks || ''
        });

        try {
            // Notify task owner
            await sendNotification({
                userId: task.userId,
                title: 'Task Approval Update',
                message: `Your task "${task.title}" has been ${decision}.`,
                type: 'task_approval',
                relatedId: task._id
            });

            // If approved, notify verified taskers
            if (decision === 'approved') {
                const verifiedTaskers = await User.find({ role: 'tasker', verificationStatus: 'verified' }).select('_id');
                const taskerIds = verifiedTaskers.map(t => t._id);
                
                await broadcastNotification({
                    userIds: taskerIds,
                    title: 'New Task Available',
                    message: `A new task "${task.title}" has been posted in your area of expertise.`,
                    type: 'task_creation',
                    relatedId: task._id,
                    room: 'verified_taskers'
                });
            }
        } catch (notifErr) {
            console.error('Notification error on task approval:', notifErr.message);
        }

        res.status(200).json({
            message: `Task ${decision} successfully`,
            task
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users?role=user
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) {
            filter.role = req.query.role;
        }
        if (req.query.status) {
            filter.verificationStatus = req.query.status;
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all tasks for admin
// @route   GET /api/admin/tasks
// @access  Private (Admin only)
export const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('userId', 'name email')
            .populate('assignedTaskerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bids for admin
// @route   GET /api/admin/bids
// @access  Private (Admin only)
export const getAllBids = async (req, res) => {
    try {
        const bids = await Bid.find()
            .populate('taskId', 'title taskStatus')
            .populate('taskerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(bids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Block or unblock a user
// @route   PUT /api/admin/toggle-block/:id
// @access  Private (Admin only)
export const toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot block admin accounts' });
        }

        user.isActive = !user.isActive;
        user.verificationStatus = user.isActive ? 'verified' : 'blocked';
        await user.save();

        res.status(200).json({
            message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                isActive: user.isActive,
                verificationStatus: user.verificationStatus
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get verification logs
// @route   GET /api/admin/verification-logs
// @access  Private (Admin only)
export const getVerificationLogs = async (req, res) => {
    try {
        const logs = await VerificationLog.find()
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves or other admins
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin accounts' });
        }

        // Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};