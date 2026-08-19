import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { sendEmail } from "../utils/emailService.js";
import { passwordResetOTPTemplate } from "../utils/emailTemplates.js";
import { env } from "../config/env.js";

const OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes
const MAX_VERIFICATION_ATTEMPTS = 5; // Maximum attempts to verify OTP
const OTP_LENGTH = 6; // 6-digit OTP

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP for secure storage
 */
const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

/**
 * Verify OTP
 */
const verifyOTP = async (otp, otpHash) => {
  return await bcrypt.compare(otp, otpHash);
};

/**
 * Request password reset - Send OTP to user's email
 */
export const requestPasswordReset = async ({ orgId, email, ipAddress }) => {
  if (!email) {
    const error = new Error("Email is required");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if super admin
  const isSuperAdmin = env.SUPERADMIN_EMAIL &&
    normalizedEmail === env.SUPERADMIN_EMAIL.toLowerCase();

  let user = null;
  let organization = null;

  if (isSuperAdmin) {
    // Super admin doesn't have a user record, but we can still send OTP
    // We'll handle this case in the reset password step
  } else {
    // For organization users, orgId is required
    if (!orgId) {
      const error = new Error("Organization ID is required");
      error.status = 400;
      throw error;
    }

    organization = await Organization.findById(orgId);
    if (!organization) {
      const error = new Error("Invalid organization");
      error.status = 404;
      throw error;
    }

    user = await User.findOne({
      email: normalizedEmail,
      organizationId: orgId
    });

    console.log(`[Password Reset] Looking for user: ${normalizedEmail} in org: ${orgId}`);
    console.log(`[Password Reset] User found: ${user ? 'YES' : 'NO'}`);

    if (!user) {
      // For security, don't reveal if email exists
      // In development, log this for debugging
      console.log(`[Password Reset] User not found - creating dummy record (no email will be sent)`);

      // Create a dummy reset record that will fail verification
      // This prevents email enumeration attacks
      const dummyOtp = generateOTP();
      const dummyOtpHash = await hashOTP(dummyOtp + "invalid"); // Invalid hash that will never match
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

      const dummyReset = new PasswordReset({
        email: normalizedEmail,
        organizationId: orgId,
        otpHash: dummyOtpHash,
        expiresAt: expiresAt,
        ipAddress: ipAddress
      });

      await dummyReset.save();

      // In development, provide a hint that the email doesn't exist
      const message = env.NODE_ENV === "development"
        ? "DEBUG: User not found in database. No email sent. Any OTP will fail."
        : "If the email exists, an OTP has been sent to your email address.";

      return {
        success: true,
        message: message,
        resetId: dummyReset._id.toString()
      };
    }

    if (!user.passwordHash) {
      console.log(`[Password Reset] User found but has no password set`);
      const error = new Error("Password not set. Contact administrator.");
      error.status = 400;
      throw error;
    }

    console.log(`[Password Reset] User found with password hash, proceeding to send OTP`);
  }

  // Generate OTP
  const otp = generateOTP();
  const otpHash = await hashOTP(otp);

  // Set expiration time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  // Invalidate any existing unverified OTPs for this email
  await PasswordReset.updateMany(
    {
      email: normalizedEmail,
      organizationId: isSuperAdmin ? null : orgId,
      verified: false,
      used: false
    },
    {
      $set: { used: true }
    }
  );

  // Create new password reset record
  const passwordReset = new PasswordReset({
    email: normalizedEmail,
    organizationId: isSuperAdmin ? null : orgId,
    otpHash: otpHash,
    expiresAt: expiresAt,
    ipAddress: ipAddress
  });

  await passwordReset.save();

  // Send OTP email
  const emailHtml = passwordResetOTPTemplate(otp, user?.name || normalizedEmail);

  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: "Password Reset OTP - MITAOE Unified ERP",
    html: emailHtml
  });

  if (!emailResult.success) {
    // If email fails, delete the password reset record
    await PasswordReset.findByIdAndDelete(passwordReset._id);
    console.error("[Password Reset] Email sending failed:", emailResult.error);
    const error = new Error(
      env.NODE_ENV === "development"
        ? `Failed to send email: ${emailResult.error || "Unknown error"}`
        : "Failed to send email. Please try again later."
    );
    error.status = 500;
    throw error;
  }

  return {
    success: true,
    message: "If the email exists, an OTP has been sent to your email address.",
    resetId: passwordReset._id.toString() // Return ID for verification step
  };
};

/**
 * Verify OTP
 */
export const verifyOTPForReset = async ({ resetId, otp, ipAddress }) => {
  if (!resetId || !otp) {
    const error = new Error("Reset ID and OTP are required");
    error.status = 400;
    throw error;
  }

  const passwordReset = await PasswordReset.findById(resetId);

  if (!passwordReset) {
    const error = new Error("Invalid or expired reset request");
    error.status = 404;
    throw error;
  }

  // Check if already used
  if (passwordReset.used) {
    const error = new Error("This reset link has already been used");
    error.status = 400;
    throw error;
  }

  // Check if expired
  if (new Date() > passwordReset.expiresAt) {
    const error = new Error("OTP has expired. Please request a new one.");
    error.status = 400;
    throw error;
  }

  // Check verification attempts
  if (passwordReset.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    const error = new Error("Maximum verification attempts exceeded. Please request a new OTP.");
    error.status = 429;
    throw error;
  }

  // Verify OTP
  const isValid = await verifyOTP(otp, passwordReset.otpHash);

  if (!isValid) {
    // Increment attempts
    passwordReset.attempts += 1;
    await passwordReset.save();

    const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - passwordReset.attempts;
    // Use generic error message to prevent email enumeration
    const error = new Error(
      remainingAttempts > 0
        ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
        : "Maximum verification attempts exceeded. Please request a new OTP."
    );
    error.status = 400;
    throw error;
  }

  // Additional check: Verify that a user exists for this email
  // This prevents using reset records created for non-existent users
  const normalizedEmail = passwordReset.email.toLowerCase();
  const isSuperAdmin = env.SUPERADMIN_EMAIL &&
    normalizedEmail === env.SUPERADMIN_EMAIL.toLowerCase();

  if (!isSuperAdmin) {
    const user = await User.findOne({
      email: normalizedEmail,
      organizationId: passwordReset.organizationId
    });

    if (!user) {
      // User doesn't exist - this was a dummy reset record
      const error = new Error("Invalid OTP. Please request a new one.");
      error.status = 400;
      throw error;
    }
  }

  // Mark as verified
  passwordReset.verified = true;
  passwordReset.attempts += 1;
  await passwordReset.save();

  return {
    success: true,
    message: "OTP verified successfully",
    resetId: passwordReset._id.toString(),
    email: passwordReset.email,
    organizationId: passwordReset.organizationId
  };
};

/**
 * Reset password with new password
 */
export const resetPassword = async ({ resetId, newPassword, confirmPassword, ipAddress }) => {
  if (!resetId || !newPassword || !confirmPassword) {
    const error = new Error("Reset ID, new password, and confirmation are required");
    error.status = 400;
    throw error;
  }

  // Validate password match
  if (newPassword !== confirmPassword) {
    const error = new Error("Passwords do not match");
    error.status = 400;
    throw error;
  }

  // Validate password strength
  if (newPassword.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.status = 400;
    throw error;
  }

  // Check for password complexity (at least one letter and one number)
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
    const error = new Error("Password must contain at least one letter and one number");
    error.status = 400;
    throw error;
  }

  const passwordReset = await PasswordReset.findById(resetId);

  if (!passwordReset) {
    const error = new Error("Invalid or expired reset request");
    error.status = 404;
    throw error;
  }

  // Check if verified
  if (!passwordReset.verified) {
    const error = new Error("OTP must be verified first");
    error.status = 400;
    throw error;
  }

  // Check if already used
  if (passwordReset.used) {
    const error = new Error("This reset link has already been used");
    error.status = 400;
    throw error;
  }

  // Check if expired
  if (new Date() > passwordReset.expiresAt) {
    const error = new Error("Reset request has expired. Please request a new one.");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = passwordReset.email.toLowerCase();
  const isSuperAdmin = env.SUPERADMIN_EMAIL &&
    normalizedEmail === env.SUPERADMIN_EMAIL.toLowerCase();

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  if (isSuperAdmin) {
    // For super admin, we can't update password in database
    // This would need to be handled via environment variable update
    // For now, we'll return an error suggesting admin contact
    const error = new Error("Super admin password reset requires system administrator intervention. Please contact your system administrator.");
    error.status = 403;
    throw error;
  }

  // Update user password
  const user = await User.findOne({
    email: normalizedEmail,
    organizationId: passwordReset.organizationId
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  user.passwordHash = passwordHash;
  await user.save();

  // Mark reset as used
  passwordReset.used = true;
  await passwordReset.save();

  // Invalidate all other pending reset requests for this user
  await PasswordReset.updateMany(
    {
      email: normalizedEmail,
      organizationId: passwordReset.organizationId,
      _id: { $ne: passwordReset._id },
      used: false
    },
    {
      $set: { used: true }
    }
  );

  return {
    success: true,
    message: "Password has been reset successfully"
  };
};
