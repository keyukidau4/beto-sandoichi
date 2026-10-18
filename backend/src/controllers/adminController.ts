import { Request, Response } from "express";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { ProductView } from "../models/ProductView";
import { User } from "../models/User";
import { EmailTemplate } from "../models/EmailTemplate";
import { BuyerProfile } from "../models/BuyerProfile";
import { emailService } from "../services/emailService";
import { renderTemplatePreview, getSampleTemplateData, validatePlaceholders } from "../utils/templateRenderer";
import Joi from "joi";

/**
 * Get analytics data for admin dashboard
 * GET /api/admin/analytics
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // Get top ordered products
    const topOrderedProducts = await Order.aggregate([
      { $match: { del_flg: false } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          orderCount: { $sum: "$items.quantity" },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $match: {
          "product.del_flg": false,
        },
      },
      {
        $project: {
          product: "$product",
          orderCount: 1,
        },
      },
    ]);

    // Get top viewed products
    const topViewedProducts = await ProductView.aggregate([
      { $match: { del_flg: false } },
      {
        $group: {
          _id: "$productId",
          viewCount: { $sum: "$count" },
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $match: {
          "product.del_flg": false,
        },
      },
      {
        $project: {
          product: "$product",
          viewCount: 1,
        },
      },
    ]);

    // Get user registration statistics
    const userStats = await User.aggregate([
      { $match: { del_flg: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format user statistics
    const userRegistrationStats = {
      total: 0,
      pending: 0,
      approved: 0,
      blacklisted: 0,
    };

    userStats.forEach((stat) => {
      userRegistrationStats.total += stat.count;
      if (stat._id === "pending") userRegistrationStats.pending = stat.count;
      if (stat._id === "approved") userRegistrationStats.approved = stat.count;
      if (stat._id === "blacklisted")
        userRegistrationStats.blacklisted = stat.count;
    });

    const analyticsData = {
      topOrderedProducts,
      topViewedProducts,
      userRegistrationStats,
    };

    res.status(200).json({
      success: true,
      data: analyticsData,
      message: "Analytics data retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Email Template Management Controllers
 */

// Validation schemas
const emailTemplateSchema = Joi.object({
  title: Joi.string().required().max(200).trim(),
  content: Joi.string().required().max(5000).trim(),
  type: Joi.string().valid("approval", "general", "promotion").required(),
});

const sendEmailSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().required()).min(1).required(),
  templateId: Joi.string().required(),
});

/**
 * Get all email templates
 * GET /api/admin/email-templates
 */
export const getEmailTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await EmailTemplate.find({ del_flg: false }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: templates,
      message: "Email templates retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email templates",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Get single email template by ID
 * GET /api/admin/email-templates/:id
 */
export const getEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findOne({
      _id: id,
      del_flg: false,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
      message: "Email template retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching email template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email template",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Create new email template
 * POST /api/admin/email-templates
 */
export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = emailTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { title, content, type } = value;

    // Create new email template
    const template = new EmailTemplate({
      title,
      content,
      type,
      del_flg: false,
    });

    await template.save();

    return res.status(201).json({
      success: true,
      data: template,
      message: "Email template created successfully",
    });
  } catch (error) {
    console.error("Error creating email template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create email template",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Update email template
 * PUT /api/admin/email-templates/:id
 */
export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate request body
    const { error, value } = emailTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { title, content, type } = value;

    // Find and update template
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: id, del_flg: false },
      { title, content, type },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
      message: "Email template updated successfully",
    });
  } catch (error) {
    console.error("Error updating email template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update email template",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Delete email template (soft delete)
 * DELETE /api/admin/email-templates/:id
 */
export const deleteEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findOneAndUpdate(
      { _id: id, del_flg: false },
      { del_flg: true },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete email template",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Preview email template with sample data
 * POST /api/admin/email-templates/:id/preview
 */
export const previewEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await EmailTemplate.findOne({
      _id: id,
      del_flg: false
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Generate sample data for all supported placeholders
    const sampleData = getSampleTemplateData();

    // Render template with sample data
    const previewHtml = renderTemplatePreview(template.content);

    // Handle missing placeholders gracefully by showing what placeholders are available
    const placeholderValidation = validatePlaceholders(template.content);

    return res.status(200).json({
      success: true,
      data: {
        previewHtml,
        sampleData,
        placeholders: {
          valid: placeholderValidation.validPlaceholders,
          invalid: placeholderValidation.invalidPlaceholders
        }
      },
      message: 'Email template preview generated successfully'
    });
  } catch (error) {
    console.error('Error generating email template preview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate email template preview',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Send email to selected users
 * POST /api/admin/send-email
 */
export const sendEmailToUsers = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = sendEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { userIds, templateId } = value;

    // Verify template exists
    const template = await EmailTemplate.findOne({
      _id: templateId,
      del_flg: false,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    // Verify users exist
    const users = await User.find({
      _id: { $in: userIds },
      del_flg: false,
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid users found",
      });
    }

    // Send emails
    await emailService.sendEmailToUsers({ userIds, templateId });

    return res.status(200).json({
      success: true,
      message: `Email sent successfully to ${users.length} users`,
    });
  } catch (error) {
    console.error("Error sending email to users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Get users for email selection
 * GET /api/admin/users-for-email
 */
export const getUsersForEmail = async (req: Request, res: Response) => {
  try {
    // Get all approved buyers with their profiles
    const users = await User.aggregate([
      {
        $match: {
          role: "buyer",
          status: "approved",
          del_flg: false,
        },
      },
      {
        $lookup: {
          from: "buyerprofiles",
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "profile.del_flg": { $ne: true },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          name: "$profile.name",
          tel: "$profile.tel",
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching users for email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
