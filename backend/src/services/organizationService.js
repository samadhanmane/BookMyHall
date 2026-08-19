import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";

export const listOrganizations = async () => {
  const orgs = await Organization.find({ isActive: true }).lean();
  return orgs;
};

export const getOrganizationById = async (orgId) => {
  const org = await Organization.findById(orgId).lean();
  if (!org || !org.isActive) {
    const error = new Error("Organization not found");
    error.status = 404;
    throw error;
  }
  return org;
};

export const getPlatformStats = async () => {
  const [totalOrganizations, activeOrganizations, totalAdmins, totalBookings] =
    await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ isActive: true }),
      User.countDocuments({ role: "org_admin" }),
      Booking.countDocuments()
    ]);

  return {
    totalOrganizations,
    activeOrganizations,
    inactiveOrganizations: totalOrganizations - activeOrganizations,
    totalAdmins,
    totalBookings
  };
};

export const createOrganization = async ({ name }) => {
  if (!name || !name.trim()) {
    const error = new Error("Organization name is required");
    error.status = 400;
    throw error;
  }

  const trimmedName = name.trim();
  const existing = await Organization.findOne({ name: trimmedName });
  if (existing) {
    const error = new Error(
      `Organization "${trimmedName}" already exists`
    );
    error.status = 400;
    throw error;
  }

  const org = await Organization.create({
    name: trimmedName,
    isActive: true
  });

  return org;
};

export const deleteOrganization = async ({ orgId }) => {
  const org = await Organization.findById(orgId);
  if (!org) {
    const error = new Error("Organization not found");
    error.status = 404;
    throw error;
  }

  await Organization.deleteOne({ _id: orgId });
};
