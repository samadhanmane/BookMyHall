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

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User does not exist' });
        }

        // First, delete any existing OTP for this email
        console.log('Deleting existing OTP for:', email);
        await OTPModel.deleteMany({ email }); // Using deleteMany to ensure all old OTPs are removed

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save new OTP
        const otpDoc = await OTPModel.create({
            email,
            otp: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        });

        console.log('New OTP Created:', {
            email,
            otp,
            storedOtp: otpDoc.otp,
            expiresAt: otpDoc.expiresAt
        });

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Your OTP for password reset of booking halls of MITAOE is:</p>
                    <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
                </div>
            `
        });

        res.json({ success: true, message: 'OTP sent successfully to your email' });

    } catch (error) {
        console.error('Error in sendOtp:', error);
        res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Find the stored OTP
        const otpRecord = await OTPModel.findOne({ email });
        
        if (!otpRecord) {
            return res.json({ success: false, message: 'OTP has expired or not found. Please request a new OTP.' });
        }

        // Check expiration
        if (Date.now() > new Date(otpRecord.expiresAt).getTime()) {
            await OTPModel.deleteOne({ email });
            return res.json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        const updateResult = await userModel.updateOne(
            { email }, 
            { password: hashedPassword }
        );
        
        if (updateResult.modifiedCount === 0) {
            return res.json({ success: false, message: 'Failed to update password. Please try again.' });
        }

        // Delete used OTP after successful password reset
        await OTPModel.deleteOne({ email });

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

        const hallData = await hallModel.findById(hallId).select('-password');
        if (!hallData.available) {
            return res.json({ success: false, message: 'Hall is not available for booking' });
        }

        let slots_booked = hallData.slots_booked;

        // checking for slots availability
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'slot is not available for booking' });
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }

        

        const userData = await userModel.findById(userId).select('-password');
        delete hallData.slots_booked;
        
        // Parallel fetch of user and hall data
        const [user, hall] = await Promise.all([
            userModel.findById(userId),
            hallModel.findById(hallId)
        ]);

        if (!user || !hall) {
            return res.json({ 
                success: false, 
                message: !user ? 'User not found' : 'Hall not found' 
            });
        }

        const dateTimestamp = new Date(slotDate).getTime();

        // Create appointment
        const appointmentData = {
            userId,
            hallId,
            slotDate,
            slotTime,
            date: dateTimestamp,
            status: 'pending',
            hallData: hall,
            userData: user
        };

        const newAppointment = await appointmentModel(appointmentData);
        await newAppointment.save();

         // save new slots data in hallData
         await hallModel.findByIdAndUpdate(hallId, { slots_booked });
        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Send emails without waiting
        Promise.all([
            transporter.sendMail({
                from: process.env.EMAIL,
                to: hall.email,
                subject: 'New Booking Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">New Booking Request</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #4CAF50;">Booking Details:</h3>
                            <p><strong>User Name:</strong> ${user.name}</p>
                            <p><strong>User Email:</strong> ${user.email}</p>
                            <p><strong>User Phone:</strong> ${user.phone || 'Not provided'}</p>
                            <p><strong>Date:</strong> ${slotDate}</p>
                            <p><strong>Time Slot:</strong> ${slotTime}</p>
                           
                            <p><strong>Status:</strong> Pending</p>
                        </div>
                        <p style="color: #666; margin-top: 20px;">Please check your dashboard for more details and to manage this booking.</p>
                    </div>
                `
            }),
            transporter.sendMail({
                from: process.env.EMAIL,
                to: user.email,
                subject: 'Booking Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Booking Confirmation</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #4CAF50;">Your booking details:</h3>
                            <p><strong>Hall Name:</strong> ${hall.name}</p>
                            <p><strong>Date:</strong> ${slotDate}</p>
                            <p><strong>Time Slot:</strong> ${slotTime}</p>

                            <p><strong>Status:</strong> Pending</p>
                        </div>
                        <p style="color: #666; margin-top: 20px;">You can check your booking status in the My Appointments section.</p>
                    </div>
                `
            })
        ]).catch(error => {
            console.error('Error sending emails:', error);
        });

        // save new slots data in hallData
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });

        res.json({ 
            success: true, 
            message: 'Appointment booked successfully. Confirmation emails will be sent shortly.' 
        });

    } catch (error) {
        console.error('Error in bookAppointment:', error);
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

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Send cancellation emails without waiting
        Promise.all([
            // Email to hall
            transporter.sendMail({
                from: process.env.EMAIL,
                to: hall.email,
                subject: 'Booking Cancellation Notice',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Booking Cancellation Notice</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #ff4444;">Booking has been cancelled:</h3>
                            <p><strong>User Name:</strong> ${user.name}</p>
                            <p><strong>Date:</strong> ${appointmentData.slotDate}</p>
                            <p><strong>Time Slot:</strong> ${appointmentData.slotTime}</p>
                            
                        </div>
                        <p style="color: #666; margin-top: 20px;">This slot is now available for new bookings.</p>
                    </div>
                `
            }),

            // Email to user
            transporter.sendMail({
                from: process.env.EMAIL,
                to: user.email,
                subject: 'Booking Cancellation Confirmation',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Booking Cancellation Confirmation</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #ff4444;">Your booking has been cancelled:</h3>
                            <p><strong>Hall Name:</strong> ${hall.name}</p>
                            <p><strong>Date:</strong> ${appointmentData.slotDate}</p>
                            <p><strong>Time Slot:</strong> ${appointmentData.slotTime}</p>
                           
                        </div>
                        <p style="color: #666; margin-top: 20px;">You can make a new booking from our website.</p>
                    </div>
                `
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

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Send approval emails without waiting
        Promise.all([
            // Email to hall
            transporter.sendMail({
                from: process.env.EMAIL,
                to: hall.email,
                subject: 'Booking Approval Confirmation',
                html: `
                     
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Booking Approved!</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #4CAF50;">Your booking has been approved:</h3>
                            <p><strong>Hall Name:</strong> ${hall.name}</p>
                            <p><strong>Date:</strong> ${appointmentData.slotDate}</p>
                            <p><strong>Time Slot:</strong> ${appointmentData.slotTime}</p>
                            <p><strong>Status:</strong> "Approved"</p>
                        </div>
                        <p style="color: #666; margin-top: 20px;">Thank you for using our service!</p>
                    </div>
                `
            }),

            // Email to user
            transporter.sendMail({
                from: process.env.EMAIL,
                to: user.email,
                subject: 'Your Booking has been Approved!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Booking Approved!</h2>
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #4CAF50;">Your booking has been approved:</h3>
                            <p><strong>Hall Name:</strong> ${hall.name}</p>
                            <p><strong>Date:</strong> ${appointmentData.slotDate}</p>
                            <p><strong>Time Slot:</strong> ${appointmentData.slotTime}</p>
                            <p><strong>Status:</strong> "Approved"</p>
                        </div>
                        <p style="color: #666; margin-top: 20px;">Thank you for using our service!</p>
                    </div>
                `
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
