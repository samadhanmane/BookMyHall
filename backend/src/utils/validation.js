import mongoose from "mongoose";
import { DATE_ONLY_REGEX } from "../booking/bookingConstants.js";

export const validateObjectId = (value) => {
  if (!value) return false;
  return mongoose.Types.ObjectId.isValid(String(value));
};

/** Matches yyyy-MM-dd pattern only (no calendar check). */
export const isDateOnlyFormat = (dateStr) =>
  DATE_ONLY_REGEX.test(String(dateStr || ""));

/** yyyy-MM-dd with a valid calendar date. */
export const validateDateOnly = (dateStr) => {
  if (!isDateOnlyFormat(dateStr)) return false;
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
};
export const validateCustomFieldValues = (customFields, customFieldValues) => {
  const values = customFieldValues || {};
  const fieldsMap = {};
  
  if (customFields && Array.isArray(customFields)) {
    for (const field of customFields) {
      fieldsMap[field.name] = field;
    }

    for (const key of Object.keys(values)) {
      if (!fieldsMap[key]) {
        delete values[key];
      }
    }

    for (const field of customFields) {
      const val = values[field.name];
      
      if (field.required && (val === undefined || val === null || val === "")) {
        const error = new Error(`Custom field '${field.name}' is required`);
        error.status = 400;
        throw error;
      }

      if (val !== undefined && val !== null && val !== "") {
        if (field.type === "number") {
          if (isNaN(Number(val))) {
            const error = new Error(`Custom field '${field.name}' must be a number`);
            error.status = 400;
            throw error;
          }
        } else if (field.type === "boolean") {
          if (typeof val !== "boolean" && val !== "true" && val !== "false" && val !== 1 && val !== 0) {
            const error = new Error(`Custom field '${field.name}' must be a boolean`);
            error.status = 400;
            throw error;
          }
        } else if (field.type === "select") {
          if (field.options && field.options.length > 0 && !field.options.includes(val)) {
            const error = new Error(`Custom field '${field.name}' must be one of: ${field.options.join(", ")}`);
            error.status = 400;
            throw error;
          }
        } else if (field.type === "multiselect") {
          if (!Array.isArray(val)) {
            const error = new Error(`Custom field '${field.name}' must be an array for multiselect`);
            error.status = 400;
            throw error;
          }
          if (field.options && field.options.length > 0) {
            for (const item of val) {
              if (!field.options.includes(item)) {
                const error = new Error(`Value '${item}' in custom field '${field.name}' is not a valid option`);
                error.status = 400;
                throw error;
              }
            }
          }
        }
      }
    }
  }
};
