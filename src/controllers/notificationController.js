import Notification from '../models/Notification.js';

// 1. Get all notifications for logged-in user
export const getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 }) // Puthusa vandhadhu first varum
            .limit(20);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if notification belongs to the user
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HELPER FUNCTION: Backend-la vera edhavadhu nadandha notification create panna idhu use aagum
export const createNotification = async (userId, message, type, link = '') => {
    try {
        await Notification.create({ userId, message, type, link });
    } catch (error) {
        console.error('Failed to create notification:', error.message);
    }
};