import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ['User', 'Task'], required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    decision: { type: String, required: true },
    remarks: { type: String }
}, { timestamps: true });

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);

export default VerificationLog;