import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import hallModel from '../models/hallModel.js';
import appointmentModel from '../models/appointmentModel.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import OTPModel from '../models/otpModel.js';
import { sendEmail, getOtpTemplate, getBookingConfirmationTemplate, getBookingCancellationTemplate, getBookingApprovalTemplate, getHallBookingConfirmationTemplate, getHallBookingCancellationTemplate } from '../services/emailService.js';
import feedbackModel from '../models/feedbackModel.js';
import connectCloudinary from '../config/cloudinary.js';

const sendOtp = async (req, res) => {
    try {
        const { email, type } = req.body; // type can be 'user' or 'hall'

        // Validate required fields
        if (!email || !type) {
            return res.json({ success: false, message: 'Email and type are required' });
        }

        // Validate type
        if (type !== 'user' && type !== 'hall') {
            return res.json({ success: false, message: 'Invalid type specified. Must be "user" or "hall"' });
        }

        // Check if user/hall exists based on type
        let entity;
        if (type === 'user') {
            entity = await userModel.findOne({ email });
        } else if (type === 'hall') {
            entity = await hallModel.findOne({ email });
        }

        if (!entity) {
            return res.json({ success: false, message: `${type} does not exist` });
        }

        // First, delete any existing OTP for this email
        await OTPModel.deleteMany({ email, type });

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save new OTP
        const otpDoc = await OTPModel.create({
            email,
            otp: otp,
            type, // Store the type (user/hall) with the OTP
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
        });

        // Send email using the email service
        const emailSent = await sendEmail({
            to: email,
            subject: 'Password Reset OTP - BookMyHall',
            html: getOtpTemplate(otp)
        });

        if (!emailSent) {
            return res.json({ success: false, message: 'Failed to send OTP email. Please try again.' });
        }

        res.json({ success: true, message: 'OTP sent successfully to your email' });

    } catch (error) {
        return res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp, newPassword, type } = req.body;

        // Validate required fields
        if (!email || !otp || !newPassword || !type) {
            return res.json({ success: false, message: 'Missing required fields. Please provide email, OTP, new password, and type.' });
        }

        // Find the stored OTP
        const otpRecord = await OTPModel.findOne({ email, type });

        if (!otpRecord) {
            return res.json({ success: false, message: 'OTP has expired or not found. Please request a new OTP.' });
        }

        // Check expiration
        const isExpired = otpRecord.isExpired();

        if (isExpired) {
            await OTPModel.deleteOne({ email, type });
            return res.json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isOtpValid = otpRecord.otp === otp;

        if (!isOtpValid) {
            return res.json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password based on type
        let updateResult;
        if (type === 'user') {
            updateResult = await userModel.updateOne(
                { email },
                { password: hashedPassword }
            );
        } else if (type === 'hall') {
            updateResult = await hallModel.updateOne(
                { email },
                { password: hashedPassword }
            );
        }

        if (updateResult.modifiedCount === 0) {
            return res.json({ success: false, message: 'Failed to update password. Please try again.' });
        }

        // Delete used OTP after successful password reset
        await OTPModel.deleteOne({ email, type });

        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });

    } catch (error) {
        return res.json({ success: false, message: 'Failed to reset password. Please try again.' });
    }
};

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !password || !email) {
            return res.json({ success: false, message: "Missing Details" });
        }

        //validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid Email" });
        }

        // validating strong password
        if (password.length < 6) {
            return res.json({ success: false, message: "Password should be at least 6 characters" });
        }

        //hasing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
            position: '',
            role: 'College Faculty'
        };
        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

//  api for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User does not exist ' });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: 'Invalid credential ' });
        }
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// api to get user profile data
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            // Return a safe default object if user not found
            return res.json({
                success: true,
                userData: {
                    name: '',
                    email: '',
                    phone: '',
                    position: '',
                    role: 'College Faculty',
                }
            });
        }
        // Ensure position and role are always present
        if (!userData.position) userData.position = '';
        if (!userData.role) userData.role = 'College Faculty';
        res.json({ success: true, userData });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// API to update user profile 
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, email, position, role } = req.body;
        if (!name || !phone || !email) {
            return res.status(400).json({ success: false, message: "Data Missing" });
        }
        const updateFields = { name, phone, email };
        if (position !== undefined) updateFields.position = position;
        if (role !== undefined) updateFields.role = role;
        // Handle image upload if file is present
        if (req.file) {
            await connectCloudinary();
            const imageUpload = await cloudinary.uploader.upload(req.file.path, {
                quality: "auto",
                fetch_format: "auto",
                transformation: [
                    { width: 400, crop: "limit" },
                    { quality: "auto" }
                ]
            });
            updateFields.image = imageUpload.secure_url;
            // Clean up the local file
            import('fs').then(fs => fs.unlinkSync(req.file.path));
        }
        const updated = await userModel.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password');
        if (!updated) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "Profile Updated", userData: updated });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Api to book appointment
const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        const { hallId, slotDate, slotTime, reason } = req.body;
        if (!hallId || !slotDate || !slotTime || !reason) {
            return res.status(400).json({ success: false, message: "Missing booking details or reason" });
        }
        // Get hall data without password
        const hallData = await hallModel.findById(hallId).select('-password');
        if (!hallData || !hallData.available) {
            return res.status(404).json({ success: false, message: 'Hall is not available for booking' });
        }
        let slots_booked = hallData.slots_booked;
        // Handle guest room bookings
        if (hallData.isGuestRoom) {
            if (slots_booked[slotDate] && slots_booked[slotDate].includes('full-day')) {
                return res.status(400).json({ success: false, message: `Room is not available for ${slotDate}` });
            }
        } else {
            const isFullDay = slotTime === 'full-day';
            const timeSlots = isFullDay ? ['10-1', '2-5'] : [slotTime];
            if (slots_booked[slotDate]) {
                for (const slot of timeSlots) {
                    if (slots_booked[slotDate].includes(slot)) {
                        return res.status(400).json({ success: false, message: `${slot} slot is not available for booking` });
                    }
                }
            } else {
                slots_booked[slotDate] = [];
            }
        }
        // Get user data without password
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Get hall data for appointment
        const hall = await hallModel.findById(hallId);
        if (!hall) {
            return res.status(404).json({ success: false, message: 'Hall not found' });
        }
        const dateTimestamp = new Date(slotDate).getTime();
        // Create appointment
        const appointmentData = {
            userId,
            hallId,
            slotDate,
            slotTime: hallData.isGuestRoom ? 'full-day' : slotTime,
            reason,
            date: dateTimestamp,
            status: 'pending',
            hallData: hall,
            userData: userData
        };
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();
        // Update slots_booked for guest rooms
        if (hallData.isGuestRoom) {
            if (!slots_booked[slotDate]) {
                slots_booked[slotDate] = [];
            }
            slots_booked[slotDate].push('full-day');
        } else {
            if (!slots_booked[slotDate]) {
                slots_booked[slotDate] = [];
            }
            slots_booked[slotDate].push(...(slotTime === 'full-day' ? ['10-1', '2-5'] : [slotTime]));
        }
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });
        // Send email notifications
        try {
            await sendEmail({
                to: userData.email,
                subject: "Booking Confirmation - BookMyHall",
                html: getBookingConfirmationTemplate(
                    userData,
                    hallData,
                    slotDate,
                    hallData.isGuestRoom ? 'full-day' : slotTime
                )
            });
            await sendEmail({
                to: hallData.email,
                subject: "New Booking Confirmation - BookMyHall",
                html: getHallBookingConfirmationTemplate(
                    userData,
                    hallData,
                    slotDate,
                    hallData.isGuestRoom ? 'full-day' : slotTime
                )
            });
        } catch (emailError) {
            console.error('Error sending email notifications:', emailError);
        }
        res.json({ success: true, message: 'Booking successful' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// List appointments for user
const listAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        // Populate hallId to get facility details
        const appointments = await appointmentModel.find({ userId })
            .populate('hallId');
        // Map to frontend-friendly format
        const formatted = appointments.map(app => ({
            _id: app._id,
            facilityId: app.hallId, // populated hall/facility
            date: app.slotDate,
            time: app.slotTime,
            cancelled: app.cancelled,
            createdAt: app.createdAt,
            reason: app.reason,
        }));
        res.json({ success: true, appointments: formatted });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId } = req.body;
        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Missing appointmentId' });
        }
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData || appointmentData.userId.toString() !== userId) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
        const [user, hall] = await Promise.all([
            userModel.findById(appointmentData.userId),
            hallModel.findById(appointmentData.hallId)
        ]);
        appointmentData.status = 'cancelled';
        await appointmentData.save();
        Promise.all([
            sendEmail({
                to: hall.email,
                subject: 'Booking Cancellation Notice - BookMyHall',
                html: getHallBookingCancellationTemplate(user, hall, appointmentData.slotDate, appointmentData.slotTime)
            }),
            sendEmail({
                to: user.email,
                subject: 'Booking Cancellation Confirmation - BookMyHall',
                html: getBookingCancellationTemplate(user, hall, appointmentData.slotDate, appointmentData.slotTime)
            })
        ]).catch(error => {
            console.error('Error sending cancellation emails:', error);
        });
        const { hallId, slotDate, slotTime } = appointmentData;
        const hallData = await hallModel.findById(hallId);
        let slots_booked = hallData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });
        res.json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const approveBooking = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Find and update the appointment
        const appointmentData = await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { status: 'approved' },
            { new: true }
        );

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        // Get user and hall data in parallel
        const [user, hall] = await Promise.all([
            userModel.findById(appointmentData.userId),
            hallModel.findById(appointmentData.hallId)
        ]);

        // Send approval emails without waiting
        Promise.all([
            // Email to hall
            sendEmail({
                to: hall.email,
                subject: 'Booking Approval Confirmation - BookMyHall',
                html: getBookingApprovalTemplate(user, hall, appointmentData.slotDate, appointmentData.slotTime)
            }),

            // Email to user
            sendEmail({
                to: user.email,
                subject: 'Your Booking has been Approved! - BookMyHall',
                html: getBookingApprovalTemplate(user, hall, appointmentData.slotDate, appointmentData.slotTime)
            })
        ]).catch(error => {
            console.error('Error sending approval emails:', error);
        });

        res.json({
            success: true,
            message: 'Booking approved successfully. Confirmation emails will be sent shortly.'
        });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        res.json({ success: true, users });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Change user password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        if (!currentPassword || !newPassword) {
            return res.json({ success: false, message: 'Missing password fields' });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }
        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'New password should be at least 6 characters' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// Get all feedbacks for the logged-in user
const getUserFeedbacks = async (req, res) => {
    try {
        const userId = req.userId;
        const feedbacks = await feedbackModel.find({ userId }).populate('appointmentId hallId');
        res.json({ success: true, feedbacks });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, sendOtp, verifyOtp, approveBooking, getAllUsers, changePassword, getUserFeedbacks };
