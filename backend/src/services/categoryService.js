import { Category } from "../models/Category.js";
import { Utility } from "../models/Utility.js";
import { pick } from "../utils/object.js";

const normalizeSlug = (slug) =>
  String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

export const listCategories = async ({ orgId }) => {
  return Category.find({ organizationId: orgId }).lean();
};

export const createCategory = async ({ orgId, payload }) => {
  if (!payload?.name || !String(payload.name).trim()) {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }
  if (!payload?.slug || !String(payload.slug).trim()) {
    const error = new Error("slug is required");
    error.status = 400;
    throw error;
  }

  const category = await Category.create({
    organizationId: orgId,
    ...pick(payload, [
      "name",
      "description",
      "icon",
      "customFields",
      "defaultTimeSlots",
      "approvalFlow",
      "isActive"
    ]),
    slug: normalizeSlug(payload.slug)
  });

  return category;
};

export const updateCategory = async ({ orgId, categoryId, payload }) => {
  const update = pick(payload, [
    "name",
    "slug",
    "description",
    "icon",
    "customFields",
    "defaultTimeSlots",
    "approvalFlow",
    "isActive"
  ]);
  if (Object.prototype.hasOwnProperty.call(update, "slug")) {
    update.slug = normalizeSlug(update.slug);
  }

  const category = await Category.findOneAndUpdate(
    { _id: categoryId, organizationId: orgId },
    update,
    { new: true }
  );

  if (!category) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }

  // Propagate approvalFlow steps to all existing utilities of this category
  if (update.approvalFlow && Array.isArray(update.approvalFlow.steps)) {
    await Utility.updateMany(
      { categoryId: category._id, organizationId: orgId },
      { $set: { approvalFlow: update.approvalFlow.steps } }
    );
  }

  // Propagate defaultTimeSlots to all existing utilities of this category
  if (update.defaultTimeSlots && Array.isArray(update.defaultTimeSlots)) {
    await Utility.updateMany(
      { categoryId: category._id, organizationId: orgId },
      { $set: { timeSlots: update.defaultTimeSlots } }
    );
  }

  // Propagate category name updates to existing utilities
  if (update.name) {
    await Utility.updateMany(
      { categoryId: category._id, organizationId: orgId },
      { $set: { categoryName: update.name } }
    );
  }

  return category;
};

export const deleteCategory = async ({ orgId, categoryId }) => {
  const hasUtilities = await Utility.exists({
    organizationId: orgId,
    categoryId
  });
  if (hasUtilities) {
    const error = new Error("Cannot delete category with existing utilities");
    error.status = 400;
    throw error;
  }

  const result = await Category.deleteOne({
    _id: categoryId,
    organizationId: orgId
  });
  if (!result.deletedCount) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }
};

