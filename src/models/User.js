import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'tasker', 'admin'], required: true },
    phone: { type: String },
    profileImage: { type: String },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'blocked'],
        default: 'pending'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;