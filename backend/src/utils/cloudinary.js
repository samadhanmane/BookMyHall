import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

/**
 * Uploads a base64 string image to Cloudinary.
 * @param {string} base64Str - The base64 data URI string.
 * @returns {Promise<string|null>} The secure URL of the uploaded image.
 */
export const uploadImageToCloudinary = async (base64Str) => {
  if (!base64Str) return null;
  
  // If it's already an uploaded URL, return it directly
  if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) {
    return base64Str;
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: "college_management"
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("[Cloudinary] Upload failed:", error);
    // Fallback to returning original string to prevent breaking flow if API key is invalid/restricted
    return base64Str;
  }
};
