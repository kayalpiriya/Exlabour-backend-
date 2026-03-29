import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The recipient of the notification
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['registration', 'verification', 'task_creation', 'task_approval', 'bidding', 'bid_acceptance', 'general'],
        required: true 
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // Can be a Task ID, Bid ID, or User ID
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
