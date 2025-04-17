import hallModel from "../models/hallModel.js"
import userModel from "../models/userModel.js"

import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import nodemailer from 'nodemailer';
import OTPModel from '../models/otpModel.js';
import { sendEmail, getOtpTemplate, getBookingConfirmationTemplate, getBookingCancellationTemplate, getBookingApprovalTemplate, getHallBookingConfirmationTemplate, getHallBookingCancellationTemplate } from '../services/emailService.js';

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

const changeAvailability = async (req,res) => {
    try {
        const {hallId} = req.body;
        const hallData = await hallModel.findById(hallId);
        await hallModel.findByIdAndUpdate(hallId,{available:!hallData.available});
        res.json({success:true,message:"Availability changed successfully"});
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

const hallList = async (req,res) => {
    try {
        // Get all halls
        const halls = await hallModel.find({}).select(['-password','-email']);
        
        // Get all active appointments
        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false
        });

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

        res.json({success:true, halls: hallsWithBookings});
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

const loginHall = async (req,res) => {
    try {
        const {email,password} = req.body;
        const hall = await hallModel.findOne({email});
        if(!hall) {
            return res.json({success:false,message:"Invalid email or password"});
        }
        const isMatch = await bcrypt.compare(password,hall.password);
        
        if(isMatch) {
           const token = jwt.sign({id:hall._id},process.env.JWT_SECRET);
           res.json({success:true,message:"Login successful",token});
        } else {
            return res.json({success:false,message:"Invalid email or password"});
        }
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// Api to get hall appointments for doctor panel
const appointmentsHall = async (req,res) => {    
    try {
        const {hallId} = req.body;
        const appointments = await appointmentModel.find({hallId});
        res.json({success:true,appointments});
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// Api to accept request
const appointmentRequest = async (req, res) => {
    try {
        const { appointmentId, hallId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        
        if (appointmentData && appointmentData.hallId === hallId) {
            if (appointmentData.isAccepted) {
                return res.json({
                    success: false,
                    message: "This time slot has already been booked and cannot be accepted again."
                });
            }

            // Update the appointment to accepted
            await appointmentModel.findByIdAndUpdate(appointmentId, { isAccepted: true });
            
            // Send acceptance emails
            const hallData = await hallModel.findById(hallId);
            
            // Email to user
            await sendEmail({
                to: appointmentData.userData.email,
                subject: "Booking Confirmed - BookMyHall",
                html: getBookingApprovalTemplate(
                    appointmentData.userData,
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
                    appointmentData.userData,
                    hallData,
                    appointmentData.slotDate,
                    appointmentData.slotTime
                )
            });
            
            res.json({ success: true, message: "Appointment accepted successfully" });
        } else {
            res.json({ success: false, message: "Appointment not found" });
        }
    } catch (error) {
        console.error('Error in appointmentRequest:', error);
        res.json({ success: false, message: error.message });
    }
}

// Api to update appointment status to completed
const appointmentComplete = async (req,res) => {
    try {
        const {hallId, appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if(appointmentData && appointmentData.hallId === hallId) {
            await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted:true});
            
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

            res.json({success:true,message:"Appointment completed successfully"});
        } else {
            res.json({success:false,message:"Appointment not found"});
        }
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// Api to update appointment status to cancel
const appointmentCancel = async (req,res) => {
    try {
        const {hallId, appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
       
        if(appointmentData && appointmentData.hallId === hallId) {
            await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true});
            
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

            res.json({success:true,message:"Appointment cancelled successfully"});
        } else {
            res.json({success:false,message:"Appointment not found"});
        }
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// Api to get dashboard data for doctor panel
const hallDashboard = async (req,res) => {
    try {
        const{hallId} = req.body;
        const appointments = await appointmentModel.find({hallId});
        let users = [];
        appointments.map((item) => {
            if(!users.includes(item.userId)){
                users.push(item.userId);
            }
        });
        const dashData = {
            appointments: appointments.length,
            users: users.length,
            latestAppointments: appointments.reverse().slice(0,5)
        };
        res.json({success:true,dashData});
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// API to get hall profile for hall panel
const hallProfile = async (req,res) => {
    try {
        const {hallId} = req.body;
        const profileData = await hallModel.findById(hallId).select(['-password']);
        res.json({success:true,profileData});
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// API to update hall profile data from hall panel
const updateHallProfile = async (req,res) => {
    try {
        const {hallId,address,available,about,speciality,name,experience} = req.body;
        await hallModel.findByIdAndUpdate(hallId,{address,available,about,speciality,name,experience});
        res.json({success:true,message:"Profile updated successfully"});
    } catch(error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// API to check if a time slot is available
const checkSlotAvailability = async (req, res) => {
    try {
        const { hallId, date, time } = req.body;
        console.log("Checking availability for:", { hallId, date, time });

        // Check if there's any existing non-cancelled appointment for this slot
        const existingAppointment = await appointmentModel.findOne({
            hallId,
            date,
            time,
            cancelled: false // Ensure we only check for non-cancelled appointments
        });

        console.log("Existing appointment found:", existingAppointment);

        if (existingAppointment) {
            console.log("Slot is not available");
            return res.json({
                success: false,
                available: false,
                message: "This time slot is already booked",
                debug: {
                    appointmentId: existingAppointment._id,
                    status: {
                        cancelled: existingAppointment.cancelled,
                        completed: existingAppointment.isCompleted,
                        accepted: existingAppointment.isAccepted
                    }
                }
            });
        }

        console.log("Slot is available");
        res.json({
            success: true,
            available: true,
            message: "Time slot is available"
        });

    } catch (error) {
        console.log("Error in checkSlotAvailability:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to cancel an appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        console.log("Cancelling appointment:", appointmentId);

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
        
        console.log("Appointment cancelled successfully");
        res.json({ success: true, message: "Appointment cancelled successfully" });
    } catch (error) {
        console.log("Error in cancelAppointment:", error);
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

        // Get the current hall to get the old email
        const currentHall = await hallModel.findById(hallId);
        if (!currentHall) {
            return res.json({ success: false, message: "Hall not found" });
        }
        
        const oldEmail = currentHall.email;
        const hallName = currentHall.name;

        // Update the hall's email
        const updatedHall = await hallModel.findByIdAndUpdate(
            hallId,
            { email: newEmail },
            { new: true }
        );

        if (!updatedHall) {
            return res.json({ success: false, message: "Hall not found" });
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
                hallId: updatedHall._id,
                newEmail: updatedHall.email
            }
        });
    } catch (error) {
        console.error('Error updating hall email:', error);
        res.json({ success: false, message: error.message });
    }
}

export {changeAvailability,
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
    updateHallEmail
}
