import nodemailer from 'nodemailer';

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Function to send emails with proper headers to avoid spam
export const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: {
                name: "Facility Booking Team",
                address: process.env.EMAIL
            },
            to,
            subject,
            html,
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high',
                'Precedence': 'bulk',
                'List-Unsubscribe': '<mailto:unsubscribe@facilitybooking.com>',
                'X-Mailer': 'Facility Booking',
                'Reply-To': process.env.EMAIL,
                'Content-Type': 'text/html; charset=utf-8',
                'MIME-Version': '1.0',
                'DKIM-Signature': 'v=1'
            }
        };

        const info = await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Update all templates to use 'Facility Booking' instead of 'BookMyHall', and update branding and references accordingly.

// Professional Welcome Email for User Registration
export const getUserWelcomeTemplate = (userName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Welcome to Facility Booking!</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for registering with <strong>Facility Booking</strong>, MITAOE's internal platform for reserving campus resources. You can now book seminar halls, guest rooms, vehicles, and more with ease.</p>
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;

// Professional Password Change Notification for User
export const getUserPasswordChangeTemplate = (userName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - Password Changed</h2>
        <p>Dear ${userName},</p>
        <p>This is a confirmation that your password has been successfully changed. If you did not make this change, please contact our support team immediately.</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;

// Professional Welcome Email for Coordinator Registration
export const getCoordinatorWelcomeTemplate = (coordinatorName) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Welcome to Facility Booking as a Coordinator!</h2>
        <p>Dear ${coordinatorName},</p>
        <p>Congratulations! You have been registered as a coordinator on <strong>Facility Booking</strong>. You can now manage hall bookings and assist users with their appointments.</p>
        <p>If you have any questions or need assistance, please contact our support team.</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;

// Booking Confirmation
export const getBookingConfirmationTemplate = (userData, hallData, slotDate, slotTime) => {
    const timeSlotDisplay = slotTime === 'full-day' ? 'Full Day (10:00 AM - 5:00 PM)' : slotTime;
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - Booking Confirmation</h2>
        <p>Dear ${userData.name || 'User'},</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <h3 style="color: #4CAF50;">Your booking details:</h3>
            <p><strong>Facility Name:</strong> ${hallData.name}</p>
            <p><strong>Date:</strong> ${slotDate}</p>
            <p><strong>Time Slot:</strong> ${timeSlotDisplay}</p>
            <p><strong>Status:</strong> Pending</p>
        </div>
        <p style="color: #666; margin-top: 20px;">You can check your booking status in the My Appointments section.</p>
        <p>Thank you for choosing Facility Booking!</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;
};

// Booking Cancellation
export const getBookingCancellationTemplate = (userData, hallData, slotDate, slotTime) => {
    const timeSlotDisplay = slotTime === 'full-day' ? 'Full Day (10:00 AM - 5:00 PM)' : slotTime;
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - Booking Cancellation</h2>
        <p>Dear ${userData.name || 'User'},</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <h3 style="color: #ff4444;">Your booking has been canceled:</h3>
            <p><strong>Facility Name:</strong> ${hallData.name}</p>
            <p><strong>Date:</strong> ${slotDate}</p>
            <p><strong>Time Slot:</strong> ${timeSlotDisplay}</p>
        </div>
        <p style="color: #666; margin-top: 20px;">You can make a new booking from our website.</p>
        <p>We hope to serve you again soon.<br/>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;
};

// OTP Email
export const getOtpTemplate = (otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - Password Reset Request</h2>
        <p>Dear User,</p>
        <p style="color: #666; line-height: 1.6;">Your OTP for password reset of booking facilities at MITAOE is:</p>
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #4CAF50; letter-spacing: 2px;">${otp}</p>
        </div>
        <p style="color: #666; line-height: 1.6;">This OTP will expire in 10 minutes.</p>
        <p style="color: #666; line-height: 1.6;">If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;

// Booking Approval
export const getBookingApprovalTemplate = (userData, hallData, slotDate, slotTime) => {
    const timeSlotDisplay = slotTime === 'full-day' ? 'Full Day (10:00 AM - 5:00 PM)' : slotTime;
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - Booking Approved!</h2>
        <p>Dear ${userData.name || 'User'},</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <h3 style="color: #4CAF50;">Booking has been approved:</h3>
            <p><strong>Facility Name:</strong> ${hallData.name}</p>
            <p><strong>Date:</strong> ${slotDate}</p>
            <p><strong>Time Slot:</strong> ${timeSlotDisplay}</p>
            <p><strong>Status:</strong> Approved</p>
        </div>
        <p style="color: #666; margin-top: 20px;">Thank you for using our service!</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;
};

// Hall Coordinator Booking Confirmation
export const getHallBookingConfirmationTemplate = (userData, hallData, slotDate, slotTime) => {
    const timeSlotDisplay = slotTime === 'full-day' ? 'Full Day (10:00 AM - 5:00 PM)' : slotTime;
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - New Booking Confirmed</h2>
        <p>Dear ${hallData.name || 'Coordinator'},</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <h3 style="color: #4CAF50;">A new booking has been confirmed for your facility:</h3>
            <p><strong>Facility Name:</strong> ${hallData.name}</p>
            <p><strong>Date:</strong> ${slotDate}</p>
            <p><strong>Time Slot:</strong> ${timeSlotDisplay}</p>
            <h4 style="color: #333; margin-top: 20px;">User Details:</h4>
            <p><strong>Name:</strong> ${userData.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${userData.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${userData.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> ${userData.address && (userData.address.line1 || userData.address.line2)
            ? `${userData.address.line1 || ''} ${userData.address.line2 || ''}`.trim()
            : 'Not provided'
        }</p>
        </div>
        <p style="color: #666; margin-top: 20px;">Please prepare the facility for the scheduled time.</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;
};

// Hall Coordinator Booking Cancellation
export const getHallBookingCancellationTemplate = (userData, hallData, slotDate, slotTime) => {
    const timeSlotDisplay = slotTime === 'full-day' ? 'Full Day (10:00 AM - 5:00 PM)' : slotTime;
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #123458; text-align: center;">Facility Booking - Booking Canceled</h2>
        <p>Dear ${hallData.name || 'Coordinator'},</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <h3 style="color: #ff4444;">A booking has been canceled for your facility:</h3>
            <p><strong>Facility Name:</strong> ${hallData.name}</p>
            <p><strong>Date:</strong> ${slotDate}</p>
            <p><strong>Time Slot:</strong> ${timeSlotDisplay}</p>
            <h4 style="color: #333; margin-top: 20px;">User Details:</h4>
            <p><strong>Name:</strong> ${userData.name || 'Not provided'}</p>
            <p><strong>Email:</strong> ${userData.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${userData.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> ${userData.address && (userData.address.line1 || userData.address.line2)
            ? `${userData.address.line1 || ''} ${userData.address.line2 || ''}`.trim()
            : 'Not provided'
        }</p>
        </div>
        <p style="color: #666; margin-top: 20px;">This time slot is now available for new bookings.</p>
        <p>Best regards,<br/>The Facility Booking Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px;">This is an automated message from Facility Booking. Please do not reply to this email.</p>
        </div>
    </div>
`;
};