import Notification from '../models/Notification.js';
import { getIO } from './socketUtils.js';

/**
 * Creates a notification in DB and emits via socket if user is online
 * @param {Object} params
 * @param {String} params.userId - Recipient User ID
 * @param {String} params.title - Notification Title
 * @param {String} params.message - Notification Message
 * @param {String} params.type - Notification Type
 * @param {String} params.relatedId - Related Document ID (Task, Bid, etc)
 */
export const sendNotification = async ({ userId, title, message, type, relatedId }) => {
    try {
        // Save to Database for offline persistence
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId
        });

        // Emit through socket if initialized
        try {
            const io = getIO();
            // Assuming the room name is the user's ID
            io.to(userId.toString()).emit('new_notification', notification);
        } catch (socketError) {
            console.error('Socket.io error emitting notification:', socketError.message);
        }

        return notification;
    } catch (dbError) {
        console.error('Database error saving notification:', dbError.message);
    }
};

/**
 * Broadcasts a notification to a specific room (e.g., 'admin', 'verified_taskers')
 * Note: Each user in the room will still need an individual DB record if we want persistence,
 * or we handle room-wide notifications differently.
 * For this implementation, we will fetch users by role/status to persist to DB.
 */
export const broadcastNotification = async ({ userIds, title, message, type, relatedId, room }) => {
    try {
        const notifications = userIds.map(userId => ({
            userId,
            title,
            message,
            type,
            relatedId
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        try {
            const io = getIO();
            // We can emit to a specific socket room
            if (room) {
                // To avoid sending the whole array of DB records, we just send a constructed payload
                io.to(room).emit('new_notification', {
                    title,
                    message,
                    type,
                    relatedId,
                    createdAt: new Date()
                });
            }
        } catch (socketError) {
            console.error('Socket.io error broadcasting notification:', socketError.message);
        }
    } catch (error) {
        console.error('Error broadcasting notification:', error.message);
    }
};
