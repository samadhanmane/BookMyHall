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

const sendOtp = async (req, res) => {
    try {
        const { email, type } = req.body; // type can be 'user' or 'hall'
        
        console.log('Sending OTP request:', { email, type });

        // Validate required fields
        if (!email || !type) {
            console.error('Missing required fields:', { email, type });
            return res.json({ success: false, message: 'Email and type are required' });
        }

        // Validate type
        if (type !== 'user' && type !== 'hall') {
            console.error('Invalid type specified:', type);
            return res.json({ success: false, message: 'Invalid type specified. Must be "user" or "hall"' });
        }

        // Check if user/hall exists based on type
        let entity;
        if (type === 'user') {
            entity = await userModel.findOne({ email });
        } else if (type === 'hall') {
            entity = await hallModel.findOne({ email });
        }

        console.log('Entity found:', entity ? 'Yes' : 'No');

        if (!entity) {
            console.error(`${type} does not exist:`, email);
            return res.json({ success: false, message: `${type} does not exist` });
        }

        // First, delete any existing OTP for this email
        console.log('Deleting existing OTP for:', email);
        await OTPModel.deleteMany({ email, type });

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('Generated OTP:', otp);
        
        // Save new OTP
        const otpDoc = await OTPModel.create({
            email,
            otp: otp,
            type, // Store the type (user/hall) with the OTP
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
        });

        console.log('New OTP Created:', {
            email,
            type,
            otp,
            storedOtp: otpDoc.otp,
            expiresAt: otpDoc.expiresAt
        });

        // Send email using the email service
        const emailSent = await sendEmail({
            to: email,
            subject: 'Password Reset OTP - BookMyHall',
            html: getOtpTemplate(otp)
        });

        console.log('Email sent:', emailSent);

        if (!emailSent) {
            console.error('Failed to send OTP email to:', email);
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
        
        console.log('Verifying OTP:', { email, type, otp });

        // Validate required fields
        if (!email || !otp || !newPassword || !type) {
            console.error('Missing required fields:', { email, otp, newPassword, type });
            return res.json({ success: false, message: 'Missing required fields. Please provide email, OTP, new password, and type.' });
        }

        // Find the stored OTP
        const otpRecord = await OTPModel.findOne({ email, type });
        console.log('OTP Record found:', otpRecord ? 'Yes' : 'No');
        
        if (!otpRecord) {
            console.error('OTP not found for:', { email, type });
            return res.json({ success: false, message: 'OTP has expired or not found. Please request a new OTP.' });
        }

        // Check expiration
        const isExpired = otpRecord.isExpired();
        console.log('OTP Expired:', isExpired);
        
        if (isExpired) {
            await OTPModel.deleteOne({ email, type });
            console.log('Deleted expired OTP for:', { email, type });
            return res.json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isOtpValid = otpRecord.otp === otp;
        console.log('OTP Valid:', isOtpValid);
        
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
        
        console.log('Password update result:', updateResult);
        
        if (updateResult.modifiedCount === 0) {
            console.error('Failed to update password for:', { email, type });
            return res.json({ success: false, message: 'Failed to update password. Please try again.' });
        }

        // Delete used OTP after successful password reset
        await OTPModel.deleteOne({ email, type });
        console.log('Deleted used OTP for:', { email, type });

        res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });

    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.json({ success: false, message: 'Failed to reset password. Please try again.' });
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
            password: hashedPassword
        };
        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
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
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// api to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select('-password');
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update user profile 
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            const imageURL = imageUpload.secure_url;

            await userModel.findByIdAndUpdate(userId, { image: imageURL });
        }
        res.json({ success: true, message: "Profile Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Api to book appointment
const bookAppointment = async (req, res) => {
    try {
        const { hallId, slotDate, slotTime } = req.body;
        const userId = req.body.userId;

        // Get hall data without password
        const hallData = await hallModel.findById(hallId).select('-password');
        if (!hallData.available) {
            return res.json({ success: false, message: 'Hall is not available for booking' });
        }

        let slots_booked = hallData.slots_booked;

        // Handle guest room bookings
        if (hallData.isGuestRoom) {
            // Check availability for the date
            if (slots_booked[slotDate] && slots_booked[slotDate].includes('full-day')) {
                return res.json({ success: false, message: `Room is not available for ${slotDate}` });
            }
        } else {
            // Handle regular hall bookings
            const isFullDay = slotTime === 'full-day';
            const timeSlots = isFullDay ? ['10-1', '2-5'] : [slotTime];

            // Check if any of the required slots are already booked
            if (slots_booked[slotDate]) {
                for (const slot of timeSlots) {
                    if (slots_booked[slotDate].includes(slot)) {
                        return res.json({ success: false, message: `${slot} slot is not available for booking` });
                    }
                }
            } else {
                slots_booked[slotDate] = [];
            }
        }

        // Get user data without password
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Get hall data for appointment
        const hall = await hallModel.findById(hallId);
        if (!hall) {
            return res.json({ success: false, message: 'Hall not found' });
        }

        const dateTimestamp = new Date(slotDate).getTime();

        // Create appointment
        const appointmentData = {
            userId,
            hallId,
            slotDate,
            slotTime: hallData.isGuestRoom ? 'full-day' : slotTime, // Guest rooms are always full-day
            date: dateTimestamp,
            status: 'pending',
            hallData: hall,
            userData: userData
        };

        const newAppointment = await appointmentModel(appointmentData);
        await newAppointment.save();

        // Update slots_booked for guest rooms
        if (hallData.isGuestRoom) {
            if (!slots_booked[slotDate]) {
                slots_booked[slotDate] = [];
            }
            slots_booked[slotDate].push('full-day');
        } else {
            // Update slots_booked for regular halls
            if (!slots_booked[slotDate]) {
                slots_booked[slotDate] = [];
            }
            slots_booked[slotDate].push(...(slotTime === 'full-day' ? ['10-1', '2-5'] : [slotTime]));
        }

        // Update hall's slots_booked
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });

        // Send email notifications
        try {
            // Email to user
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

            // Email to hall/guest room coordinator
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
            // Continue with the booking even if email sending fails
        }

        res.json({ success: true, message: 'Booking successful' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

      

const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;

        // Find the appointment to delete
        const appointmentData = await appointmentModel.findById(appointmentId);
        //verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Appointment not found' });
        }
         // Update the hall's slots_booked
         await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
          // Get user and hall data in parallel
        const [user, hall] = await Promise.all([
            userModel.findById(appointmentData.userId),
            hallModel.findById(appointmentData.hallId)
        ]);

        // Update appointment status
        appointmentData.status = 'cancelled';
        await appointmentData.save();

        // Send cancellation emails without waiting
        Promise.all([
            // Email to hall
            sendEmail({
                to: hall.email,
                subject: 'Booking Cancellation Notice - BookMyHall',
                html: getHallBookingCancellationTemplate(user, hall, appointmentData.slotDate, appointmentData.slotTime)
            }),

            // Email to user
            sendEmail({
                to: user.email,
                subject: 'Booking Cancellation Confirmation - BookMyHall',
                html: getBookingCancellationTemplate(user, hall, appointmentData.slotDate, appointmentData.slotTime)
            })
        ]).catch(error => {
            console.error('Error sending cancellation emails:', error);
        });

        // releasing hall slot
        const { hallId, slotDate, slotTime } = appointmentData;
        const hallData = await hallModel.findById(hallId);
        let slots_booked = hallData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });


        
        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
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
        console.error('Error in approveBooking:', error);
        res.json({ success: false, message: error.message });
    }
};

export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, sendOtp, verifyOtp, approveBooking };
