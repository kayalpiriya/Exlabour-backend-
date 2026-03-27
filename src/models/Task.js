import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    deadline: { type: Date, required: true },
    location: { type: String, required: true },
    attachments: [{ type: String }],
    approvalStatus: {
        type: String,
        enum: ['pending_admin_approval', 'approved', 'rejected'],
        default: 'pending_admin_approval'
    },
    taskStatus: {
        type: String,
        enum: ['open_for_bidding', 'assigned', 'in_progress', 'completed', 'cancelled'],
        default: 'open_for_bidding'
    },
    assignedTaskerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;