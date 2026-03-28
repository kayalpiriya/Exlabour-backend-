import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['system', 'bid', 'task', 'admin'], default: 'system' },
    isRead: { type: Boolean, default: false },
    link: { type: String } // Click panna endha page poganum (optional)
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;