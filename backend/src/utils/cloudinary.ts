import cloudinary from "../config/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

/**
 * Upload image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Cloudinary folder to upload to
 * @returns Promise with upload result
 */
export const uploadImage = async (
  file: string,
  folder: string = "banhmi-app/products"
): Promise<CloudinaryUploadResult> => {
  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif"],
      transformation: [
        { width: 800, height: 600, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Promise with deletion result
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};

/**
 * Validate file type and size
 * @param file - Express multer file
 * @returns boolean indicating if file is valid
 */
export const validateImageFile = (
  file: Express.Multer.File
): { isValid: boolean; error?: string } => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  const maxSize = 3 * 1024 * 1024; // 3MB

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error:
        "Invalid file type. Only JPEG, JPG, PNG, and GIF files are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size too large. Maximum size is 3MB.",
    };
  }

  return { isValid: true };
};
