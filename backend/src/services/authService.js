import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";

export const login = async ({ orgId, email, password }) => {
  if (!email || !password) {
    const error = new Error("email and password are required");
    error.status = 400;
    throw error;
  }

  // Super admin login (platform level, not bound to an organization)
  if (
    env.SUPERADMIN_EMAIL &&
    env.SUPERADMIN_PASSWORD &&
    email.toLowerCase() === env.SUPERADMIN_EMAIL.toLowerCase() &&
    password === env.SUPERADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      {
        sub: "super-admin",
        email: env.SUPERADMIN_EMAIL,
        role: "super_admin",
        organizationId: null
      },
      env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return {
      token,
      user: {
        id: "super-admin",
        email: env.SUPERADMIN_EMAIL,
        role: "super_admin",
        organizationId: null,
        orgName: "Platform"
      }
    };
  }

  // For all non-super-admin users, an organization ID is required
  if (!orgId) {
    const error = new Error("orgId is required for organization users");
    error.status = 400;
    throw error;
  }

  const org = await Organization.findById(orgId);
  if (!org) {
    const error = new Error("Invalid organization");
    error.status = 401;
    throw error;
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    organizationId: org._id
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (!user.passwordHash) {
    const error = new Error("Password not set. Contact administrator.");
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? String(user.organizationId) : null
    },
    env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      orgName: org.name,
      department: user.department || null
    }
  };
};

