import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['user', 'hall'],
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Add a method to check if OTP is expired
otpSchema.methods.isExpired = function() {
    return Date.now() > this.expiresAt.getTime();
};

// Add index for faster queries
otpSchema.index({ email: 1, type: 1 });

export default mongoose.model('OTP', otpSchema);