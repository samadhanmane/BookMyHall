import { Category } from "../models/Category.js";
import { User } from "../models/User.js";
import { Utility } from "../models/Utility.js";
import { Booking } from "../models/Booking.js";
import { pick } from "../utils/object.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import { validateCustomFieldValues } from "../utils/validation.js";

const validateCoordinators = async (orgId, coordinatorIds) => {
  if (!coordinatorIds || !Array.isArray(coordinatorIds)) return;
  for (const cid of coordinatorIds) {
    if (!cid) continue;
    const cleanCid = typeof cid === "object" ? String(cid._id || cid.id || cid) : String(cid);
    const user = await User.findOne({ _id: cleanCid, organizationId: orgId }).lean();
    if (!user) {
      const error = new Error(`Coordinator user ${cleanCid} not found in organization`);
      error.status = 400;
      throw error;
    }
  }
};

const validateApprovalFlow = (approvalFlow) => {
  if (!approvalFlow || !Array.isArray(approvalFlow)) return;
  const validRoles = ["coordinator", "hod", "registrar", "director"];
  
  approvalFlow.forEach(s => {
    if (s && s.role && !validRoles.includes(s.role)) {
      const error = new Error(`Invalid role '${s.role}' in approvalFlow. Valid roles are: coordinator, hod, registrar, director`);
      error.status = 400;
      throw error;
    }
  });
};

export const listUtilities = async ({ orgId, categoryId }) => {
  const query = { organizationId: orgId };
  if (categoryId) {
    query.categoryId = categoryId;
  }

  const utilities = await Utility.find(query).lean();
  const categories = await Category.find({ organizationId: orgId }).lean();
  const categoryMap = {};
  categories.forEach((c) => { categoryMap[String(c._id)] = c; });

  return utilities.map((u) => {
    if (!u.timeSlots || u.timeSlots.length === 0) {
      const catIdStr = u.categoryId ? String(u.categoryId._id || u.categoryId) : "";
      if (categoryMap[catIdStr]?.defaultTimeSlots) {
        u.timeSlots = categoryMap[catIdStr].defaultTimeSlots;
      }
    }
    return u;
  });
};

export const getUtilityById = async ({ orgId, utilityId }) => {
  const utility = await Utility.findOne({
    _id: utilityId,
    organizationId: orgId
  }).lean();

  if (!utility) {
    const error = new Error("Utility not found");
    error.status = 404;
    throw error;
  }

  if (!utility.timeSlots || utility.timeSlots.length === 0) {
    const category = await Category.findById(utility.categoryId).lean();
    if (category && category.defaultTimeSlots) {
      utility.timeSlots = category.defaultTimeSlots;
    }
  }

  return utility;
};

export const createUtility = async ({ orgId, payload }) => {
  if (!payload?.categoryId) {
    const error = new Error("categoryId is required");
    error.status = 400;
    throw error;
  }
  if (!payload?.name || !String(payload.name).trim()) {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  await validateCoordinators(orgId, payload.coordinatorIds);
  validateApprovalFlow(payload.approvalFlow);

  const category = await Category.findOne({
    _id: payload.categoryId,
    organizationId: orgId
  });
  if (!category) {
    const error = new Error("Invalid category");
    error.status = 400;
    throw error;
  }

  validateCustomFieldValues(category.customFields, payload.customFieldValues);

  let uploadedImages = [];
  if (payload?.images && Array.isArray(payload.images)) {
    uploadedImages = await Promise.all(
      payload.images.map(img => (typeof img === "string" && img.startsWith("data:image/")) ? uploadImageToCloudinary(img) : img)
    );
  }

  const rawPayload = pick(payload, [
    "name",
    "description",
    "linkedHallId",
    "customFieldValues",
    "isActive",
    "coordinatorIds",
    "timeSlots",
    "approvalFlow",
    "disabledDateRanges",
    "disabledDaysOfWeek"
  ]);

  if (rawPayload.timeSlots && Array.isArray(rawPayload.timeSlots)) {
    rawPayload.timeSlots = rawPayload.timeSlots.map((slot, index) => {
      const startTime = String(slot.startTime || "09:00").trim();
      const endTime = String(slot.endTime || "10:00").trim();
      const formatT = (t) => {
        if (!t || !t.includes(":")) return t || "";
        const [h, m] = t.split(":").map(Number);
        if (isNaN(h)) return t;
        const ampm = h >= 12 ? "PM" : "AM";
        const dh = h % 12 || 12;
        return `${dh}:${String(m || 0).padStart(2, "0")} ${ampm}`;
      };
      const autoLabel = `${formatT(startTime)} - ${formatT(endTime)}`;
      const label = slot.label && String(slot.label).trim() ? String(slot.label).trim() : autoLabel;
      return {
        id: slot.id || `slot-${Date.now()}-${index}`,
        startTime,
        endTime,
        label,
        isActive: slot.isActive !== false
      };
    });
  }

  const utility = await Utility.create({
    organizationId: orgId,
    categoryId: payload.categoryId,
    categoryName: category.name,
    ...rawPayload,
    images: uploadedImages
  });

  return utility;
};

export const updateUtility = async ({ orgId, utilityId, payload }) => {
  const existingUtility = await Utility.findOne({ _id: utilityId, organizationId: orgId }).lean();
  if (!existingUtility) {
    const error = new Error("Utility not found");
    error.status = 404;
    throw error;
  }

  if (payload?.coordinatorIds !== undefined) {
    await validateCoordinators(orgId, payload.coordinatorIds);
  }
  if (payload?.approvalFlow !== undefined) {
    validateApprovalFlow(payload.approvalFlow);
  }

  // Safely pick editable fields. Note: categoryId & organizationId are omitted from pick list.
  const update = pick(payload, [
    "name",
    "description",
    "linkedHallId",
    "customFieldValues",
    "isActive",
    "coordinatorIds",
    "timeSlots",
    "approvalFlow",
    "disabledDateRanges",
    "disabledDaysOfWeek"
  ]);

  // Clean and validate timeSlots array to allow adding, editing, and deleting any number of slots
  if (update.timeSlots && Array.isArray(update.timeSlots)) {
    update.timeSlots = update.timeSlots.map((slot, index) => {
      const startTime = String(slot.startTime || "09:00").trim();
      const endTime = String(slot.endTime || "10:00").trim();

      const formatT = (t) => {
        if (!t || !t.includes(":")) return t || "";
        const [h, m] = t.split(":").map(Number);
        if (isNaN(h)) return t;
        const ampm = h >= 12 ? "PM" : "AM";
        const dh = h % 12 || 12;
        return `${dh}:${String(m || 0).padStart(2, "0")} ${ampm}`;
      };

      const autoLabel = `${formatT(startTime)} - ${formatT(endTime)}`;
      const label = slot.label && String(slot.label).trim() ? String(slot.label).trim() : autoLabel;

      return {
        id: slot.id || `slot-${Date.now()}-${index}`,
        startTime,
        endTime,
        label,
        isActive: slot.isActive !== false
      };
    });
  }

  if (payload?.images && Array.isArray(payload.images)) {
    update.images = await Promise.all(
      payload.images.map(img => (typeof img === "string" && img.startsWith("data:image/")) ? uploadImageToCloudinary(img) : img)
    );
  }

  const utility = await Utility.findOneAndUpdate(
    { _id: utilityId, organizationId: orgId },
    { $set: update },
    { new: true, runValidators: true }
  );

  if (!utility) {
    const error = new Error("Utility not found");
    error.status = 404;
    throw error;
  }

  return utility;
};

export const deleteUtility = async ({ orgId, utilityId }) => {
  const hasBookings = await Booking.exists({
    organizationId: orgId,
    utilityId
  });
  if (hasBookings) {
    const error = new Error("Cannot delete utility with existing bookings");
    error.status = 400;
    throw error;
  }

  const result = await Utility.deleteOne({
    _id: utilityId,
    organizationId: orgId
  });
  if (!result.deletedCount) {
    const error = new Error("Utility not found");
    error.status = 404;
    throw error;
  }
};
