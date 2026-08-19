import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";

const ALLOWED_ROLES = [
  "org_admin",
  "coordinator",
  "hod",
  "workshop_hod",
  "registrar",
  "director",
  "worker",
  "faculty",
  "assistant",
  "canteen_owner"
];

const canActOnOrg = (reqUser, orgId) => {
  if (reqUser.role === "super_admin") return true;
  if (reqUser.role === "org_admin" && reqUser.organizationId === String(orgId))
    return true;
  return false;
};

export const listUsers = async ({ orgId, reqUser }) => {
  if (!canActOnOrg(reqUser, orgId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  return User.find({ organizationId: orgId }).lean();
};

export const createUser = async ({ orgId, reqUser, payload }) => {
  const { name, email, password, role, department, phone } = payload;

  if (!canActOnOrg(reqUser, orgId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  if (!name || !email || !password || !role) {
    const error = new Error("name, email, password, role are required");
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }

  const org = await Organization.findById(orgId);
  if (!org) {
    const error = new Error("Invalid organization");
    error.status = 400;
    throw error;
  }

  // Check if email already exists (globally unique)
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.organizationId && String(existing.organizationId) === String(orgId)) {
      const error = new Error("User already exists in this organization");
      error.status = 400;
      throw error;
    }
    const error = new Error("Email already exists in another organization");
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    organizationId: orgId,
    department,
    phone
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };
};

export const updateUser = async ({ orgId, userId, reqUser, payload }) => {
  const { name, email, password, role, department, phone } = payload;

  if (!canActOnOrg(reqUser, orgId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const user = await User.findOne({
    _id: userId,
    organizationId: orgId
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // Update fields
  if (name) user.name = name;
  if (email && email !== user.email) {
    // Check if new email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && String(existing._id) !== String(userId)) {
      const error = new Error("Email already exists");
      error.status = 400;
      throw error;
    }
    user.email = email.toLowerCase();
  }
  if (role && ALLOWED_ROLES.includes(role)) user.role = role;
  if (department !== undefined) user.department = department;
  if (phone !== undefined) user.phone = phone;
  if (password) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    department: user.department,
    phone: user.phone
  };
};

export const deleteUser = async ({ orgId, userId, reqUser }) => {
  if (!canActOnOrg(reqUser, orgId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const result = await User.deleteOne({
    _id: userId,
    organizationId: orgId
  });

  if (!result.deletedCount) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
};

export const updateSelfProfile = async ({ orgId, userId, payload }) => {
  const { name, email, phone } = payload;

  const user = await User.findOne({
    _id: userId,
    organizationId: orgId
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  // Update self-editable fields
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && String(existing._id) !== String(userId)) {
      const error = new Error("Email already exists");
      error.status = 400;
      throw error;
    }
    user.email = email.toLowerCase();
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    department: user.department,
    phone: user.phone
  };
};

