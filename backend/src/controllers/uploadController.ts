import { Request, Response } from "express";
import { uploadImage, validateImageFile } from "../utils/cloudinary";

/**
 * Upload image to Cloudinary
 */
export const uploadImageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    // Validate file
    const validation = validateImageFile(req.file);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: validation.error,
      });
      return;
    }

    // Convert buffer to base64 for Cloudinary
    const base64File = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await uploadImage(base64File, "banhmi-app/products");

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      },
    });
  } catch (error) {
    console.error("Upload controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
