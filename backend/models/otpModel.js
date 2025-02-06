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
    expiresAt: {
        type: Date,
        required: true,
    }
});

// Add a method to check if OTP is expired
otpSchema.methods.isExpired = function() {
    return Date.now() > this.expiresAt.getTime();
};

export default mongoose.model('OTP', otpSchema);