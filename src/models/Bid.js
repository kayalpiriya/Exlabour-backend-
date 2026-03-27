import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    taskerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidAmount: { type: Number, required: true },
    deliveryDays: { type: Number, required: true },
    proposalMessage: { type: String, required: true },
    bidStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    }
}, { timestamps: true });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;