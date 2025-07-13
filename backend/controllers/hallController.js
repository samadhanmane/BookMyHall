import hallModel from "../models/hallModel.js"
import userModel from "../models/userModel.js"

import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import nodemailer from 'nodemailer';
import OTPModel from '../models/otpModel.js';
import { sendEmail, getOtpTemplate, getBookingConfirmationTemplate, getBookingCancellationTemplate, getBookingApprovalTemplate, getHallBookingConfirmationTemplate, getHallBookingCancellationTemplate } from '../services/emailService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from "cloudinary";
import connectCloudinary from "../config/cloudinary.js";
import feedbackModel from '../models/feedbackModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('image');

const sendOtp = async (req, res) => {
    try {
        const { email, type } = req.body;

        // Validate required fields
        if (!email || !type) {
            return res.json({ success: false, message: 'Email and type are required' });
        }

        // Validate type
        if (type !== 'user' && type !== 'hall') {
            return res.json({ success: false, message: 'Invalid type specified. Must be "user" or "hall"' });
        }

        // Check if hall exists
        const hall = await hallModel.findOne({ email });
        if (!hall) {
            return res.json({ success: false, message: 'Hall does not exist' });
        }

        // First, delete any existing OTP for this email
        await OTPModel.deleteMany({ email, type });

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save new OTP
        const otpDoc = await OTPModel.create({
            email,
            otp: otp,
            type,
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
        console.error('Error in sendOtp:', error);
        res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
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

        // Update password
        const updateResult = await hallModel.updateOne(
            { email },
            { password: hashedPassword }
        );

        if (updateResult.modifiedCount === 0) {
            return res.json({ success: false, message: 'Failed to update password. Please try again.' });
        }

        // Delete used OTP after successful password reset
        await OTPModel.deleteOne({ email, type });

        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });

    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.json({ success: false, message: 'Failed to reset password. Please try again.' });
    }
};

const changeAvailability = async (req, res) => {
    try {
        const { hallId } = req.body;
        const hallData = await hallModel.findById(hallId);
        await hallModel.findByIdAndUpdate(hallId, { available: !hallData.available });
        res.json({ success: true, message: "Availability changed successfully" });
    } catch (error) {
        console.error('Error in changeAvailability:', error);
        res.json({ success: false, message: error.message });
    }
}

const hallList = async (req, res) => {
    try {
        // Get all halls
        const halls = await hallModel.find({}).select(['-password', '-email']);
        if (!halls) {
            return res.status(500).json({ success: false, message: 'No halls found in the database.' });
        }
        // Get all active appointments
        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false
        });
        if (!appointments) {
            return res.status(500).json({ success: false, message: 'No appointments found in the database.' });
        }
        // Create a map of hall bookings
        const hallBookings = {};
        appointments.forEach(appointment => {
            if (!hallBookings[appointment.hallId]) {
                hallBookings[appointment.hallId] = [];
            }
            hallBookings[appointment.hallId].push({
                slotDate: appointment.slotDate,
                slotTime: appointment.slotTime,
                userData: appointment.userData,
                isAccepted: appointment.isAccepted,
                isCompleted: appointment.isCompleted,
                cancelled: appointment.cancelled
            });
        });
        // Add bookings to each hall
        const hallsWithBookings = halls.map(hall => {
            const hallObj = hall.toObject();
            hallObj.bookings = hallBookings[hall._id] || [];
            return hallObj;
        });
        res.json({ success: true, halls: hallsWithBookings });
    } catch (error) {
        console.error('Error in hallList:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error in hallList.' });
    }
}

const loginHall = async (req, res) => {
    try {
        const { email, password } = req.body;
        const hall = await hallModel.findOne({ email });
        if (!hall) {
            return res.json({ success: false, message: "Invalid email or password" });
        }
        const isMatch = await bcrypt.compare(password, hall.password);

        if (isMatch) {
            const token = jwt.sign({ id: hall._id }, process.env.JWT_SECRET);
            res.json({ success: true, message: "Login successful", token });
        } else {
            return res.json({ success: false, message: "Invalid email or password" });
        }
    } catch (error) {
        console.error('Error in loginHall:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to get hall appointments for doctor panel
const appointmentsHall = async (req, res) => {
    try {
        const hallId = req.hall._id.toString();
        // Populate userId and hallId to get user profile and facility name
        const appointments = await appointmentModel.find({ hallId }).populate('userId hallId');
        // Attach userData and facility name for frontend compatibility
        const appointmentsWithUserData = appointments.map(app => ({
            ...app.toObject(),
            userData: app.userId,
            facilityName: app.hallId?.name || ''
        }));
        res.json({ success: true, appointments: appointmentsWithUserData });
    } catch (error) {
        console.error('Error in appointmentsHall:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to accept request
const appointmentRequest = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const { id, email, role } = req.user;
        const appointmentData = await appointmentModel.findById(appointmentId).populate('hallId userId');

        // Debug logging
        console.log('[appointmentRequest] user:', req.user);
        console.log('[appointmentRequest] appointmentId:', appointmentId);
        console.log('[appointmentRequest] appointmentData.hallId:', appointmentData ? appointmentData.hallId : 'N/A');

        if (!appointmentData) {
            return res.json({
                success: false,
                message: "Appointment not found"
            });
        }

        const facility = appointmentData.hallId;
        if (!facility || !facility.email) {
            return res.json({ success: false, message: "Facility or coordinator email not found for this booking. Please check the facility data." });
        }

        // Coordinator: can approve if they manage this facility
        if (role === 'coordinator') {
            if (facility.email !== email) {
                return res.json({ success: false, message: "You do not manage this facility" });
            }
        }
        // Hall: can approve if it's their own
        else if (role === 'hall') {
            if (facility._id.toString() !== id) {
                return res.json({
                    success: false,
                    message: "This appointment does not belong to your hall"
                });
            }
        } else {
            return res.json({ success: false, message: "Unauthorized role for approval" });
        }

        if (appointmentData.isAccepted) {
            return res.json({
                success: false,
                message: "This time slot has already been booked and cannot be accepted again."
            });
        }

        // Ensure userId is populated
        const user = appointmentData.userId || { name: 'Unknown', email: '-' };
        // Update the appointment to accepted and set all status fields for halls
        await appointmentModel.findByIdAndUpdate(appointmentId, {
            isAccepted: true,
            status: 'Approved',
            coordinatorDecision: 'approved',
            directorDecision: 'approved'
        });
        // Send acceptance emails
        const hallData = await hallModel.findById(facility._id);
        // Email to user
        await sendEmail({
            to: user.email,
            subject: "Booking Confirmed - BookMyHall",
            html: getBookingApprovalTemplate(
                user,
                hallData,
                appointmentData.slotDate,
                appointmentData.slotTime
            )
        });
        // Email to hall coordinator
        await sendEmail({
            to: hallData.email,
            subject: "New Booking Confirmed - BookMyHall",
            html: getHallBookingConfirmationTemplate(
                user,
                hallData,
                appointmentData.slotDate,
                appointmentData.slotTime
            )
        });
        res.json({ success: true, message: "Appointment accepted successfully", facilityName: hallData.name });
    } catch (error) {
        console.error('Error in appointmentRequest:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to update appointment status to completed
const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const hallId = req.hall._id.toString(); // Convert to string

        const appointmentData = await appointmentModel.findById(appointmentId);

        // Debug logging
        console.log('[appointmentComplete] hallId from token:', hallId);
        console.log('[appointmentComplete] appointmentId:', appointmentId);
        console.log('[appointmentComplete] appointmentData.hallId:', appointmentData ? appointmentData.hallId : 'N/A');

        if (!appointmentData) {
            return res.json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (appointmentData.hallId.toString() !== hallId) {
            return res.json({
                success: false,
                message: "This appointment does not belong to your hall"
            });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

        // Send completion emails
        const hallData = await hallModel.findById(hallId);

        // Email to user
        await sendEmail({
            to: appointmentData.userData.email,
            subject: "Booking Completed - BookMyHall",
            html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #333; text-align: center;">BookMyHall - Thank You!</h2>
                        <p>Dear ${appointmentData.userData.name},</p>
                        <p>Your booking for <strong>${hallData.name}</strong> has been completed.</p>
                        <p><strong>Date:</strong> ${appointmentData.slotDate}</p>
                        <p><strong>Time:</strong> ${appointmentData.slotTime}</p>
                        <p>We hope you had a great experience. Please consider leaving a review!</p>
                        <p>Thank you for choosing BookMyHall!</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                            <p style="color: #999; font-size: 12px;">This is an automated message from BookMyHall, please do not reply to this email.</p>
                        </div>
                    </div>
                `
        });

        // Email to hall coordinator
        await sendEmail({
            to: hallData.email,
            subject: "Booking Completed - BookMyHall",
            html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #333; text-align: center;">BookMyHall - Booking Completed</h2>
                        <p>A booking has been completed for your hall.</p>
                        <p><strong>Hall:</strong> ${hallData.name}</p>
                        <p><strong>Date:</strong> ${appointmentData.slotDate}</p>
                        <p><strong>Time:</strong> ${appointmentData.slotTime}</p>
                        <p><strong>User Details:</strong></p>
                        <p>Name: ${appointmentData.userData.name}</p>
                        <p>Email: ${appointmentData.userData.email}</p>
                        <p>Phone: ${appointmentData.userData.phone}</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                            <p style="color: #999; font-size: 12px;">This is an automated message from BookMyHall, please do not reply to this email.</p>
                        </div>
                    </div>
                `
        });

        res.json({ success: true, message: "Appointment completed successfully", facilityName: hallData.name });
    } catch (error) {
        console.error('Error in appointmentComplete:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to update appointment status to cancel
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const hallId = req.hall._id.toString(); // Convert to string

        const appointmentData = await appointmentModel.findById(appointmentId);

        // Debug logging
        console.log('[appointmentCancel] hallId from token:', hallId);
        console.log('[appointmentCancel] appointmentId:', appointmentId);
        console.log('[appointmentCancel] appointmentData.hallId:', appointmentData ? appointmentData.hallId : 'N/A');

        if (!appointmentData) {
            return res.json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (appointmentData.hallId.toString() !== hallId) {
            return res.json({
                success: false,
                message: "This appointment does not belong to your hall"
            });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Send cancellation emails
        const hallData = await hallModel.findById(hallId);

        // Email to user
        await sendEmail({
            to: appointmentData.userData.email,
            subject: "Booking Cancelled - BookMyHall",
            html: getBookingCancellationTemplate(
                appointmentData.userData,
                hallData,
                appointmentData.slotDate,
                appointmentData.slotTime
            )
        });

        // Email to hall coordinator
        await sendEmail({
            to: hallData.email,
            subject: "Booking Cancelled - BookMyHall",
            html: getHallBookingCancellationTemplate(
                appointmentData.userData,
                hallData,
                appointmentData.slotDate,
                appointmentData.slotTime
            )
        });

        res.json({ success: true, message: "Appointment cancelled successfully", facilityName: hallData.name });
    } catch (error) {
        console.error('Error in appointmentCancel:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to get dashboard data for doctor panel
const hallDashboard = async (req, res) => {
    try {
        const { role, email, id } = req.user;
        let appointments = [];
        if (role === 'coordinator') {
            // Find all guest rooms and vehicles managed by this coordinator
            const facilities = await hallModel.find({
                email: email,
                $or: [{ isGuestRoom: true }, { isVehicle: true }]
            });
            const facilityIds = facilities.map(f => f._id);
            appointments = await appointmentModel.find({ hallId: { $in: facilityIds } }).populate('userId hallId');
        } else if (role === 'hall') {
            appointments = await appointmentModel.find({ hallId: id }).populate('userId hallId');
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        let users = [];
        appointments.map((item) => {
            if (!users.includes(item.userId)) {
                users.push(item.userId);
            }
        });
        // Attach userData and facility name for frontend compatibility in latestAppointments
        const latestAppointments = appointments.reverse().slice(0, 5).map(app => ({
            ...app.toObject(),
            userData: app.userId,
            facilityName: app.hallId?.name || ''
        }));
        const dashData = {
            appointments: appointments.length,
            users: users.length,
            latestAppointments
        };
        res.json({ success: true, dashData });
    } catch (error) {
        console.error('Error in hallDashboard:', error);
        res.json({ success: false, message: error.message });
    }
}

// API to get hall profile for hall panel
const hallProfile = async (req, res) => {
    try {
        const hallId = req.hall._id; // Get ID from authenticated hall
        const profileData = await hallModel.findById(hallId).select(['-password']);
        res.json({ success: true, profileData });
    } catch (error) {
        console.error('Error in hallProfile:', error);
        res.json({ success: false, message: error.message });
    }
}

// API to update hall profile data from hall panel
const updateHallProfile = async (req, res) => {
    try {
        const { hallId, address, available, about, speciality, name, experience } = req.body;
        await hallModel.findByIdAndUpdate(hallId, { address, available, about, speciality, name, experience });
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error('Error in updateHallProfile:', error);
        res.json({ success: false, message: error.message });
    }
}

// API to check if a time slot is available
const checkSlotAvailability = async (req, res) => {
    try {
        const { hallId, date, time } = req.body;
        const existingAppointment = await appointmentModel.findOne({
            hallId,
            date,
            time,
            cancelled: false
        });

        if (existingAppointment) {
            return res.json({
                success: false,
                available: false,
                message: "This time slot is already booked"
            });
        }

        res.json({
            success: true,
            available: true,
            message: "Time slot is available"
        });

    } catch (error) {
        console.error('Error in checkSlotAvailability:', error);
        res.json({ success: false, message: error.message });
    }
}

// API to cancel an appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Update the appointment to cancelled
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, isAccepted: false });

        // Send cancellation emails
        const hallData = await hallModel.findById(appointmentData.hallId);

        // Email to user
        await sendEmail({
            to: appointmentData.userData.email,
            subject: "Booking Cancelled - BookMyHall",
            html: getBookingCancellationTemplate(
                appointmentData.userData,
                hallData,
                appointmentData.slotDate,
                appointmentData.slotTime
            )
        });

        // Email to hall coordinator
        await sendEmail({
            to: hallData.email,
            subject: "Booking Cancelled - BookMyHall",
            html: getHallBookingCancellationTemplate(
                appointmentData.userData,
                hallData,
                appointmentData.slotDate,
                appointmentData.slotTime
            )
        });

        res.json({ success: true, message: "Appointment cancelled successfully", facilityName: hallData.name });
    } catch (error) {
        console.error('Error in cancelAppointment:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to update hall coordinator's email
const updateHallEmail = async (req, res) => {
    try {
        const { hallId, newEmail } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.json({ success: false, message: "Invalid email format" });
        }

        // Check if new email is already in use by another hall
        const existingHall = await hallModel.findOne({ email: newEmail });
        if (existingHall && existingHall._id.toString() !== hallId) {
            return res.json({ success: false, message: "Email is already in use by another hall" });
        }

        // Get the current hall to get the old email and type
        const currentHall = await hallModel.findById(hallId);
        if (!currentHall) {
            return res.json({ success: false, message: "Hall not found" });
        }

        const oldEmail = currentHall.email;
        const hallName = currentHall.name;

        let updateResult;
        if (currentHall.isGuestRoom) {
            // Update all documents with the old email, regardless of isGuestRoom
            const trimmedOldEmail = oldEmail.trim();
            const trimmedNewEmail = newEmail.trim();
            updateResult = await hallModel.updateMany(
                { email: trimmedOldEmail },
                { email: trimmedNewEmail }
            );
            // Fetch and log all docs with the new email to verify
            const updatedRooms = await hallModel.find({ email: trimmedNewEmail });
        } else {
            // Update only this hall
            updateResult = await hallModel.findByIdAndUpdate(
                hallId,
                { email: newEmail.trim() },
                { new: true }
            );
        }

        // Send confirmation email to both old and new email addresses
        try {
            // Email to old email address
            await sendEmail({
                to: oldEmail,
                subject: "Email Update Notification - BookMyHall",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #333; text-align: center;">BookMyHall - Email Update Notification</h2>
                        <p>Dear ${hallName},</p>
                        <p>This is to inform you that your email address has been updated.</p>
                        <p>Your new email address is: <strong>${newEmail}</strong></p>
                        <p>Please use this new email address for all future communications.</p>
                        <p>If you did not request this change, please contact us immediately.</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                            <p style="color: #999; font-size: 12px;">This is an automated message from BookMyHall, please do not reply to this email.</p>
                        </div>
                    </div>
                `
            });

            // Email to new email address
            await sendEmail({
                to: newEmail,
                subject: "Welcome to BookMyHall - Email Update Confirmation",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #333; text-align: center;">BookMyHall - Email Update Confirmation</h2>
                        <p>Dear ${hallName},</p>
                        <p>Your email address has been successfully updated.</p>
                        <p>You can now use this email address to:</p>
                        <ul>
                            <li>Log in to your hall dashboard</li>
                            <li>Receive booking notifications</li>
                            <li>Communicate with users</li>
                        </ul>
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                            <p style="color: #999; font-size: 12px;">This is an automated message from BookMyHall, please do not reply to this email.</p>
                        </div>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Error sending confirmation emails:', emailError);
            // Continue with the response even if email sending fails
        }

        res.json({
            success: true,
            message: "Email updated successfully",
            data: {
                hallId: currentHall._id,
                newEmail: newEmail
            }
        });
    } catch (error) {
        console.error('Error updating hall email:', error);
        res.json({ success: false, message: error.message });
    }
}

// Get all guest rooms for a coordinator
const getCoordinatorGuestRooms = async (req, res) => {
    try {
        const email = req.hall.email;
        const guestRooms = await hallModel.find({
            email: email,
            isGuestRoom: true
        }).select('-password');

        res.json({
            success: true,
            message: guestRooms.length > 0 ? "Guest rooms fetched successfully" : "No guest rooms found for this coordinator",
            data: {
                email: email,
                guestRooms: guestRooms || []
            }
        });

    } catch (error) {
        console.error('Error in getCoordinatorGuestRooms:', error);
        res.json({
            success: false,
            message: error.message || "Failed to fetch guest rooms"
        });
    }
}

// API to update guest room
// NOTE: The frontend should first upload the image using the uploadImage endpoint (which returns a Cloudinary URL),
// then send that URL in the 'image' field when calling updateGuestRoom. The DB will always store a Cloudinary URL.
const updateGuestRoom = async (req, res) => {
    try {
        const { roomId, name, speciality, experience, about, address, available, image } = req.body;
        const hallId = req.hall._id;

        // Find the room and verify it belongs to the authenticated hall
        const room = await hallModel.findOne({
            _id: roomId,
            email: req.hall.email
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found or unauthorized'
            });
        }

        // Update the room
        const updatedRoom = await hallModel.findByIdAndUpdate(
            roomId,
            {
                name,
                speciality,
                experience,
                about,
                address,
                available,
                image // This should be a Cloudinary URL
            },
            { new: true, select: '-password' } // Return updated document without password
        );

        res.json({
            success: true,
            message: 'Guest room updated successfully',
            room: updatedRoom
        });
    } catch (error) {
        console.error('Error updating guest room:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update guest room'
        });
    }
};

export const uploadImage = async (req, res) => {
    // Ensure Cloudinary is configured
    await connectCloudinary();
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        } else if (err) {
            // An unknown error occurred
            console.error('Unknown error:', err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        // Everything went fine
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        try {
            // Upload to Cloudinary
            const imageUpload = await cloudinary.uploader.upload(req.file.path, {
                quality: "auto",
                fetch_format: "auto",
                transformation: [
                    { width: 800, crop: "limit" },
                    { quality: "auto" }
                ]
            });
            const imageUrl = imageUpload.secure_url;

            // Clean up the local file
            fs.unlinkSync(req.file.path);

            return res.json({
                success: true,
                message: 'Image uploaded successfully',
                imageUrl: imageUrl
            });
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image to Cloudinary.'
            });
        }
    });
};

const getHalls = async (req, res) => {
    try {
        const hallEmail = req.hall.email;
        const halls = await hallModel.find({ email: hallEmail });

        res.json({
            success: true,
            message: 'Halls fetched successfully',
            halls: halls
        });
    } catch (error) {
        console.error('Error in getHalls:', error);
        res.json({
            success: false,
            message: error.message || 'Failed to fetch halls'
        });
    }
};

// API to submit feedback for a completed appointment
const submitFeedback = async (req, res) => {
    try {
        const { appointmentId, cleanliness, descriptionMatch, electricity, otherComments, rating, userId } = req.body;
        // const userId = req.user._id; // use userId from req.body

        // Find the appointment and check if it is completed
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment || !appointment.isCompleted) {
            return res.status(400).json({ success: false, message: 'Appointment not found or not completed yet.' });
        }

        // Prevent duplicate feedback for the same appointment
        const existingFeedback = await feedbackModel.findOne({ appointmentId, userId });
        if (existingFeedback) {
            return res.status(400).json({ success: false, message: 'Feedback already submitted for this appointment.' });
        }

        const feedback = new feedbackModel({
            appointmentId,
            hallId: appointment.hallId,
            userId,
            cleanliness,
            descriptionMatch,
            electricity,
            otherComments,
            rating
        });
        await feedback.save();
        res.json({ success: true, message: 'Feedback submitted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// API to get all feedbacks submitted by a user
const getUserFeedbacks = async (req, res) => {
    try {
        const userId = req.body.userId;
        const feedbacks = await feedbackModel.find({ userId }).populate('appointmentId hallId');
        res.json({ success: true, feedbacks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// API to get all feedbacks for a hall
const getHallFeedbacks = async (req, res) => {
    try {
        const hallId = req.hall._id;
        const feedbacks = await feedbackModel.find({ hallId }).populate('appointmentId userId');
        res.json({ success: true, feedbacks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// API for hall coordinator to review feedback
const reviewFeedback = async (req, res) => {
    try {
        const { feedbackId, adminRating, adminMessage } = req.body;
        const hallId = req.hall._id;
        const feedback = await feedbackModel.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found.' });
        }
        if (feedback.hallId.toString() !== hallId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to review this feedback.' });
        }
        feedback.adminRating = adminRating;
        feedback.adminMessage = adminMessage;
        feedback.reviewedBy = hallId;
        feedback.adminReviewedAt = new Date();
        await feedback.save();
        res.json({ success: true, message: 'Feedback reviewed successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// API to get average rating and count for each hall
const getHallRatings = async (req, res) => {
    try {
        const ratings = await feedbackModel.aggregate([
            {
                $group: {
                    _id: "$hallId",
                    averageRating: { $avg: "$rating" },
                    ratingCount: { $sum: 1 }
                }
            }
        ]);
        res.json({ success: true, ratings });
    } catch (error) {
        console.error('Error in getHallRatings:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Get all vehicles for a coordinator
const getCoordinatorVehicles = async (req, res) => {
    try {
        const email = req.hall.email;
        const vehicles = await hallModel.find({
            email: email,
            isVehicle: true
        }).select('-password');
        res.json({
            success: true,
            message: vehicles.length > 0 ? "Vehicles fetched successfully" : "No vehicles found for this coordinator",
            data: {
                email: email,
                vehicles: vehicles || []
            }
        });
    } catch (error) {
        console.error('Error in getCoordinatorVehicles:', error);
        res.json({
            success: false,
            message: error.message || "Failed to fetch vehicles"
        });
    }
}

// API to update vehicle
const updateVehicle = async (req, res) => {
    try {
        const { vehicleId, name, speciality, experience, about, address, available, image } = req.body;
        const hallId = req.hall._id;
        // Find the vehicle and verify it belongs to the authenticated hall
        const vehicle = await hallModel.findOne({
            _id: vehicleId,
            email: req.hall.email
        });
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found or unauthorized'
            });
        }
        // Update the vehicle
        const updatedVehicle = await hallModel.findByIdAndUpdate(
            vehicleId,
            {
                name,
                speciality,
                experience,
                about,
                address,
                available,
                image
            },
            { new: true, select: '-password' }
        );
        res.json({
            success: true,
            message: 'Vehicle updated successfully',
            vehicle: updatedVehicle
        });
    } catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update vehicle'
        });
    }
};

// Coordinator approval/rejection for guestroom/vehicle bookings
export const bookingDecision = async (req, res) => {
    try {
        const { appointmentId, decision, comment } = req.body;
        if (!appointmentId || !['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ success: false, message: 'Invalid request.' });
        }
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }
        // Only allow for guestroom or vehicle
        const hall = await hallModel.findById(appointment.hallId);
        if (!hall || (!hall.isGuestRoom && !hall.isVehicle)) {
            return res.status(400).json({ success: false, message: 'Only guestroom and vehicle bookings require director approval.' });
        }
        // Update appointment
        appointment.coordinatorDecision = decision;
        appointment.coordinatorComment = comment || '';
        appointment.statusHistory = appointment.statusHistory || [];
        appointment.statusHistory.push({
            status: `coordinator_${decision}`,
            by: 'coordinator',
            comment: comment || '',
            date: new Date()
        });
        if (decision === 'approved') {
            appointment.directorDecision = 'pending';
            appointment.status = 'Pending Director Approval';
        } else {
            appointment.directorDecision = 'pending'; // stays pending, but will be ignored in UI
            appointment.status = 'Pending Director Approval';
        }
        await appointment.save();
        // Re-populate userId and hallId for response
        await appointment.populate('userId hallId');
        res.json({ success: true, message: `Booking ${decision} by coordinator.`, appointment });
    } catch (error) {
        console.error('Error in bookingDecision:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Get all appointments for all facilities managed by the coordinator (by email)
const allCoordinatorAppointments = async (req, res) => {
    try {
        const { role, email, id } = req.user;
        let appointments = [];
        if (role === 'coordinator') {
            // Find all guest rooms and vehicles managed by this coordinator
            const facilities = await hallModel.find({
                email: email,
                $or: [{ isGuestRoom: true }, { isVehicle: true }]
            });
            const facilityIds = facilities.map(f => f._id);
            appointments = await appointmentModel.find({ hallId: { $in: facilityIds } })
                .populate('userId hallId');
        } else if (role === 'hall') {
            appointments = await appointmentModel.find({ hallId: id })
                .populate('userId hallId');
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        // Attach userData, hallData, and facility name for frontend compatibility
        const formatted = appointments.map(app => ({
            ...app.toObject(),
            userData: app.userId ? app.userId : { name: 'Unknown', email: '-' },
            hallData: app.hallId ? app.hallId : { name: 'Unknown', email: '-' },
            facilityName: app.hallId?.name || ''
        }));
        res.json({ success: true, appointments: formatted });
    } catch (error) {
        console.error('Error in allCoordinatorAppointments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export {
    changeAvailability,
    hallList,
    loginHall,
    appointmentsHall,
    appointmentComplete,
    appointmentCancel,
    hallDashboard,
    hallProfile,
    updateHallProfile,
    appointmentRequest,
    checkSlotAvailability,
    cancelAppointment,
    sendOtp,
    verifyOtp,
    updateHallEmail,
    getCoordinatorGuestRooms,
    updateGuestRoom,
    getHalls,
    submitFeedback,
    getUserFeedbacks,
    getHallFeedbacks,
    reviewFeedback,
    getHallRatings,
    getCoordinatorVehicles,
    updateVehicle,
    allCoordinatorAppointments
}
