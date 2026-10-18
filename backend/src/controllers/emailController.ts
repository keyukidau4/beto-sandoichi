import { Request, Response } from "express";
import { EmailTemplate } from "../models/EmailTemplate";
import { EmailHistory } from "../models/EmailHistory";
import { EmailRecipient } from "../models/EmailRecipient";
import { User } from "../models/User";
import {
  extractPlaceholders,
  validatePlaceholders,
  renderTemplatePreview,
  getSampleTemplateData,
} from "../utils/templateRenderer";
import {
  validateEmails,
  validateRecipientLimit,
} from "../utils/emailValidator";
import {
  processBulkEmail,
  getBulkEmailProgress,
} from "../services/bulkEmailService";
import { 
  EmailError, 
  EmailErrorCode, 
  TemplateError, 
  RecipientError,
  classifyError 
} from "../utils/emailErrors";
import { emailLogger } from "../services/emailLoggingService";
import { emailHealthMonitor } from "../services/emailHealthMonitor";
import { emailErrorRecoveryService } from "../services/emailErrorRecoveryService";

/**
 * Email Template Management Controllers
 * All endpoints require admin authentication
 */

/**
 * Get all email templates
 * GET /api/admin/email/templates
 */
export const getEmailTemplates = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const adminId = req.user?._id?.toString();
  const adminEmail = req.user?.email;

  try {
    const templates = await EmailTemplate.find({ del_flg: false })
      .sort({ createdAt: -1 })
      .select("_id title type isDefault createdAt updatedAt");

    const duration = Date.now() - startTime;
    
    emailLogger.logSuccess(
      'GET_EMAIL_TEMPLATES',
      adminId,
      adminEmail,
      { templateCount: templates.length },
      duration
    );

    return res.status(200).json({
      success: true,
      data: templates,
      message: "Email templates retrieved successfully",
    });
  } catch (error) {
    const emailError = classifyError(error);
    const duration = Date.now() - startTime;
    
    emailLogger.logError(
      'GET_EMAIL_TEMPLATES',
      emailError,
      adminId,
      adminEmail,
      undefined,
      { duration }
    );

    return res.status(emailError.statusCode).json({
      success: false,
      message: emailError.getUserMessage(),
      code: emailError.code,
      error: process.env.NODE_ENV === "development" ? emailError.toJSON() : undefined,
    });
  }
};

/**
 * Get single email template by ID
 * GET /api/admin/email/templates/:id
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
 * POST /api/admin/email/templates
 * Note: Validation and sanitization is handled by middleware
 */
export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { title, type, sanitizedContent, placeholderValidation } = req.body;

    // Extract placeholders from sanitized content
    const extractedPlaceholders = extractPlaceholders(sanitizedContent);

    // Create new email template
    const template = new EmailTemplate({
      title: title.trim(),
      content: sanitizedContent,
      type,
      placeholders: extractedPlaceholders,
      isDefault: false,
      del_flg: false,
    });

    await template.save();

    return res.status(201).json({
      success: true,
      data: template,
      message: "Email template created successfully",
      placeholderInfo: {
        validPlaceholders: placeholderValidation.validPlaceholders,
        totalPlaceholders: extractedPlaceholders.length,
      },
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
 * PUT /api/admin/email/templates/:id
 * Note: Validation and sanitization is handled by middleware
 */
export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, sanitizedContent, placeholderValidation } = req.body;

    // Check if template exists
    const existingTemplate = await EmailTemplate.findOne({
      _id: id,
      del_flg: false,
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: "Email template not found",
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (type !== undefined) updateData.type = type;
    if (sanitizedContent !== undefined) {
      updateData.content = sanitizedContent;
      updateData.placeholders = extractPlaceholders(sanitizedContent);
    }

    // Update template
    const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedTemplate,
      message: "Email template updated successfully",
      placeholderInfo: sanitizedContent
        ? {
            validPlaceholders: placeholderValidation?.validPlaceholders || [],
            totalPlaceholders: updateData.placeholders?.length || 0,
          }
        : undefined,
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
 * DELETE /api/admin/email/templates/:id
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
 * POST /api/admin/email/templates/:id/preview
 */
export const previewEmailTemplate = async (req: Request, res: Response) => {
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
          invalid: placeholderValidation.invalidPlaceholders,
        },
      },
      message: "Email template preview generated successfully",
    });
  } catch (error) {
    console.error("Error generating email template preview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate email template preview",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Bulk Email Management Controllers
 */

/**
 * Get available buyers for email sending
 * GET /api/admin/email/recipients
 */
export const getEmailRecipients = async (req: Request, res: Response) => {
  try {
    // Get all approved buyers with their profiles
    const buyers = await User.aggregate([
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
          name: "$profile.name",
          point: "$profile.point",
          createdAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: buyers,
      message: "Available email recipients retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching email recipients:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email recipients",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Send bulk email to selected recipients
 * POST /api/admin/email/send-bulk
 */
export const sendBulkEmail = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const adminId = req.user?._id?.toString();
  const adminEmail = req.user?.email;

  try {
    // Check if email service is available
    if (!emailHealthMonitor.isFeatureAvailable('bulkEmail')) {
      const degradationOptions = emailHealthMonitor.getDegradationOptions();
      
      emailLogger.logError(
        'BULK_EMAIL_SERVICE_UNAVAILABLE',
        new EmailError('Bulk email service is unavailable', EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE),
        adminId,
        adminEmail,
        undefined,
        { degradationOptions }
      );

      return res.status(503).json({
        success: false,
        message: degradationOptions.recommendedAction,
        code: EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE,
        serviceStatus: emailHealthMonitor.getHealthStatus()
      });
    }

    const { templateId, recipientIds } = req.body;

    // Validate input
    if (!templateId || !recipientIds || !Array.isArray(recipientIds)) {
      const error = new RecipientError(
        'Template ID and recipient IDs are required',
        EmailErrorCode.NO_RECIPIENTS_SELECTED
      );
      
      emailLogger.logError('BULK_EMAIL_VALIDATION_FAILED', error, adminId, adminEmail);
      
      return res.status(error.statusCode).json({
        success: false,
        message: error.getUserMessage(),
        code: error.code
      });
    }

    // Validate recipient limit (max 10 recipients) - this is also checked by middleware
    if (!validateRecipientLimit(recipientIds)) {
      const error = new RecipientError(
        'Maximum 10 recipients allowed per bulk email',
        EmailErrorCode.RECIPIENT_LIMIT_EXCEEDED,
        { recipientCount: recipientIds.length, maxAllowed: 10 }
      );
      
      emailLogger.logError('BULK_EMAIL_RECIPIENT_LIMIT', error, adminId, adminEmail);
      
      return res.status(error.statusCode).json({
        success: false,
        message: error.getUserMessage(),
        code: error.code,
        maxAllowed: 10,
        provided: recipientIds.length
      });
    }

    // Check if template exists
    const template = await EmailTemplate.findOne({
      _id: templateId,
      del_flg: false,
    });

    if (!template) {
      const error = new TemplateError(
        'Email template not found',
        EmailErrorCode.TEMPLATE_NOT_FOUND,
        { templateId }
      );
      
      emailLogger.logError('BULK_EMAIL_TEMPLATE_NOT_FOUND', error, adminId, adminEmail);
      
      return res.status(error.statusCode).json({
        success: false,
        message: error.getUserMessage(),
        code: error.code
      });
    }

    console.log({recipientIds});
    

    // Get recipient details
    const recipients = await User.aggregate([
      {
        $match: {
          _id: {
            $in: recipientIds.map(
              (id) => new (require("mongoose").Types.ObjectId)(id)
            ),
          },
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
          name: "$profile.name",
          point: "$profile.point",
        },
      },
    ]);

    if (recipients.length === 0) {
      const error = new RecipientError(
        'No valid recipients found',
        EmailErrorCode.RECIPIENT_NOT_FOUND,
        { requestedIds: recipientIds }
      );
      
      emailLogger.logError('BULK_EMAIL_NO_RECIPIENTS', error, adminId, adminEmail);
      
      return res.status(error.statusCode).json({
        success: false,
        message: error.getUserMessage(),
        code: error.code
      });
    }

    // Validate all recipient emails
    const recipientEmails = recipients.map((r) => r.email);

    const emailValidation = validateEmails(recipientEmails);
    if (!emailValidation.valid) {
      const error = new RecipientError(
        `Invalid email addresses found: ${emailValidation.invalidEmails.join(", ")}`,
        EmailErrorCode.INVALID_EMAIL_ADDRESS,
        { invalidEmails: emailValidation.invalidEmails }
      );
      
      emailLogger.logError('BULK_EMAIL_INVALID_EMAILS', error, adminId, adminEmail);
      
      return res.status(error.statusCode).json({
        success: false,
        message: error.getUserMessage(),
        code: error.code,
        invalidEmails: emailValidation.invalidEmails
      });
    }

    // Execute with circuit breaker protection
    const result = await emailHealthMonitor.executeWithCircuitBreaker(async () => {
      // Create EmailHistory record
      const emailHistory = new EmailHistory({
        templateId: template._id,
        templateTitle: template.title,
        templateContent: template.content,
        recipientCount: recipients.length,
        successCount: 0,
        failureCount: 0,
        status: "sending",
        sentBy: adminId,
        sentAt: new Date(),
      });

      await emailHistory.save();

      // Create EmailRecipient records with pending status and pre-rendered content
      const emailRecipients = await Promise.all(
        recipients.map(async (recipient) => {
          // Pre-render personalized content for tracking purposes
          const templateData = {
            name: recipient.name || recipient.email,
            email: recipient.email,
            point: recipient.point || 0,
            currentDate: new Date().toLocaleDateString("ja-JP"),
            systemName: "BanhMi App",
          };

          const { renderTemplate } = await import("../utils/templateRenderer");
          const personalizedContent = renderTemplate(
            template.content,
            templateData
          );

          return {
            historyId: emailHistory._id,
            buyerId: recipient._id,
            buyerName: recipient.name || recipient.email,
            buyerEmail: recipient.email,
            personalizedContent,
            status: "pending" as const,
          };
        })
      );

      await EmailRecipient.insertMany(emailRecipients);

      // Start bulk email processing asynchronously
      processBulkEmail(emailHistory._id.toString(), template, recipients).catch(
        (error) => {
          const emailError = classifyError(error);
          emailLogger.logError(
            'BULK_EMAIL_PROCESSING_FAILED',
            emailError,
            adminId,
            adminEmail,
            undefined,
            { historyId: emailHistory._id.toString() }
          );
        }
      );

      return {
        historyId: emailHistory._id,
        recipientCount: recipients.length,
        status: "sending",
      };
    }, 'BULK_EMAIL_SEND');

    const duration = Date.now() - startTime;
    
    emailLogger.logBulkEmail(
      'BULK_EMAIL_INITIATED',
      adminId!,
      adminEmail!,
      templateId,
      recipients.length,
      0, // successCount - will be updated during processing
      0, // failureCount - will be updated during processing
      duration
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: "Bulk email sending initiated successfully",
    });
  } catch (error) {
    const emailError = classifyError(error);
    const duration = Date.now() - startTime;
    
    emailLogger.logError(
      'BULK_EMAIL_INITIATION_FAILED',
      emailError,
      adminId,
      adminEmail,
      undefined,
      { duration, templateId: req.body.templateId, recipientCount: req.body.recipientIds?.length }
    );

    return res.status(emailError.statusCode).json({
      success: false,
      message: emailError.getUserMessage(),
      code: emailError.code,
      error: process.env.NODE_ENV === "development" ? emailError.toJSON() : undefined,
    });
  }
};

/**
 * Email Service Health and Monitoring Controllers
 */

/**
 * Get email service health status
 * GET /api/admin/email/health
 */
export const getEmailServiceHealth = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const adminId = req.user?._id?.toString();
  const adminEmail = req.user?.email;

  try {
    const healthStatus = emailHealthMonitor.getHealthStatus();
    const circuitBreakerState = emailHealthMonitor.getCircuitBreakerState();
    const degradationOptions = emailHealthMonitor.getDegradationOptions();
    
    // Perform a fresh health check
    const freshHealthCheck = await emailHealthMonitor.performHealthCheck();
    
    const duration = Date.now() - startTime;
    
    emailLogger.logSuccess(
      'EMAIL_HEALTH_CHECK',
      adminId,
      adminEmail,
      { 
        status: healthStatus.status,
        smtpConnected: healthStatus.smtpConnected,
        responseTime: healthStatus.responseTime
      },
      duration
    );

    return res.status(200).json({
      success: true,
      data: {
        status: freshHealthCheck.status,
        lastCheck: freshHealthCheck.lastCheck,
        consecutiveFailures: freshHealthCheck.consecutiveFailures,
        lastError: freshHealthCheck.lastError,
        responseTime: freshHealthCheck.responseTime,
        smtpConnected: freshHealthCheck.smtpConnected,
        queueSize: freshHealthCheck.queueSize,
        features: freshHealthCheck.features,
        circuitBreaker: circuitBreakerState,
        degradationOptions,
        recommendations: getHealthRecommendations(freshHealthCheck, circuitBreakerState)
      },
      message: "Email service health status retrieved successfully"
    });
  } catch (error) {
    const emailError = classifyError(error);
    const duration = Date.now() - startTime;
    
    emailLogger.logError(
      'EMAIL_HEALTH_CHECK_FAILED',
      emailError,
      adminId,
      adminEmail,
      undefined,
      { duration }
    );

    return res.status(emailError.statusCode).json({
      success: false,
      message: emailError.getUserMessage(),
      code: emailError.code,
      error: process.env.NODE_ENV === "development" ? emailError.toJSON() : undefined,
    });
  }
};

/**
 * Get email service metrics
 * GET /api/admin/email/metrics
 */
export const getEmailServiceMetrics = async (req: Request, res: Response) => {
  const startTime = Date.now();
  const adminId = req.user?._id?.toString();
  const adminEmail = req.user?.email;

  try {
    const metrics = emailLogger.getMetrics();
    const recentLogs = emailLogger.getRecentLogs(50);
    const errorLogs = emailLogger.getErrorLogs(
      new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );
    
    // Get admin-specific activity if requested
    const adminActivity = adminId ? emailLogger.getAdminActivity(adminId, 24) : null;
    
    // Detect anomalies
    const anomalies = emailLogger.detectAnomalies(adminId);
    
    const duration = Date.now() - startTime;
    
    emailLogger.logSuccess(
      'EMAIL_METRICS_RETRIEVED',
      adminId,
      adminEmail,
      { 
        totalEmailsSent: metrics.totalEmailsSent,
        totalEmailsFailed: metrics.totalEmailsFailed,
        successRate: metrics.successRate
      },
      duration
    );

    return res.status(200).json({
      success: true,
      data: {
        metrics,
        recentActivity: {
          recentLogs: recentLogs.slice(0, 20), // Limit to 20 most recent
          errorLogs: errorLogs.slice(0, 10), // Limit to 10 most recent errors
        },
        adminActivity,
        anomalies,
        systemHealth: {
          status: emailHealthMonitor.getHealthStatus().status,
          circuitBreakerState: emailHealthMonitor.getCircuitBreakerState().state
        }
      },
      message: "Email service metrics retrieved successfully"
    });
  } catch (error) {
    const emailError = classifyError(error);
    const duration = Date.now() - startTime;
    
    emailLogger.logError(
      'EMAIL_METRICS_RETRIEVAL_FAILED',
      emailError,
      adminId,
      adminEmail,
      undefined,
      { duration }
    );

    return res.status(emailError.statusCode).json({
      success: false,
      message: emailError.getUserMessage(),
      code: emailError.code,
      error: process.env.NODE_ENV === "development" ? emailError.toJSON() : undefined,
    });
  }
};

/**
 * Helper function to generate health recommendations
 */
function getHealthRecommendations(
  healthStatus: any,
  circuitBreakerState: any
): string[] {
  const recommendations: string[] = [];

  if (healthStatus.status === 'unhealthy') {
    recommendations.push('Email service is unhealthy. Check SMTP configuration and server connectivity.');
  }

  if (healthStatus.consecutiveFailures > 3) {
    recommendations.push('Multiple consecutive failures detected. Consider checking email server status.');
  }

  if (circuitBreakerState.state === 'open') {
    recommendations.push('Circuit breaker is open. Email sending is temporarily disabled to prevent further failures.');
  }

  if (!healthStatus.smtpConnected) {
    recommendations.push('SMTP connection failed. Verify SMTP server settings and credentials.');
  }

  if (healthStatus.responseTime && healthStatus.responseTime > 5000) {
    recommendations.push('Email service response time is slow. Consider checking network connectivity.');
  }

  if (!healthStatus.features.bulkEmail) {
    recommendations.push('Bulk email feature is disabled due to service issues. Individual emails may still work.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Email service is operating normally.');
  }

  return recommendations;
}

/**
 * Get bulk email sending progress
 * GET /api/admin/email/send-progress/:id
 */
export const getBulkEmailSendProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const progress = await getBulkEmailProgress(id);

    return res.status(200).json({
      success: true,
      data: progress,
      message: "Bulk email progress retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting bulk email progress:", error);

    if (error instanceof Error && error.message === "Email history not found") {
      return res.status(404).json({
        success: false,
        message: "Email history not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get bulk email progress",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Get lightweight bulk email status for real-time updates
 * GET /api/admin/email/send-status/:id
 */
export const getBulkEmailSendStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get lightweight status information for real-time updates
    const history = await EmailHistory.findById(id).select(
      "status successCount failureCount recipientCount completedAt"
    );

    if (!history) {
      return res.status(404).json({
        success: false,
        message: "Email history not found",
      });
    }

    // Get current status counts from recipients
    const statusCounts = await EmailRecipient.aggregate([
      {
        $match: {
          historyId: new (require("mongoose").Types.ObjectId)(id),
          del_flg: false,
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const processedCount = (counts.sent || 0) + (counts.failed || 0);
    const progressPercentage =
      history.recipientCount > 0
        ? Math.round((processedCount / history.recipientCount) * 100)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        historyId: id,
        status: history.status,
        totalRecipients: history.recipientCount,
        processedCount,
        progressPercentage,
        successCount: counts.sent || 0,
        failureCount: counts.failed || 0,
        pendingCount: counts.pending || 0,
        isComplete:
          history.status === "completed" || history.status === "failed",
        completedAt: history.completedAt,
      },
      message: "Bulk email status retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting bulk email status:", error);

    if (error instanceof Error && error.message === "Email history not found") {
      return res.status(404).json({
        success: false,
        message: "Email history not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get bulk email status",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Email History Management Controllers
 */

/**
 * Get email history with pagination and filtering
 * GET /api/admin/email/history
 */
export const getEmailHistory = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      templateId,
      status,
    } = req.query;

    // Build filter object
    const filter: any = { del_flg: false };

    // Date range filtering
    if (startDate || endDate) {
      filter.sentAt = {};
      if (startDate) {
        filter.sentAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        // Add 23:59:59 to end date to include the entire day
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        filter.sentAt.$lte = endDateTime;
      }
    }

    // Template filtering
    if (templateId) {
      filter.templateId = new (require("mongoose").Types.ObjectId)(
        templateId as string
      );
    }

    // Status filtering
    if (
      status &&
      ["sending", "completed", "failed"].includes(status as string)
    ) {
      filter.status = status;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await EmailHistory.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get email history with recipients using aggregation
    const emailHistory = await EmailHistory.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "emailrecipients",
          localField: "_id",
          foreignField: "historyId",
          as: "recipients",
          pipeline: [
            { $match: { del_flg: { $ne: true } } },
            {
              $project: {
                buyerId: 1,
                buyerName: 1,
                buyerEmail: 1,
                status: 1,
                error: 1,
                sentAt: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "emailtemplates",
          localField: "templateId",
          foreignField: "_id",
          as: "template",
          pipeline: [
            { $match: { del_flg: { $ne: true } } },
            { $project: { title: 1, type: 1 } }
          ]
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "sentBy",
          foreignField: "_id",
          as: "sentByUser",
          pipeline: [
            { $match: { del_flg: { $ne: true } } },
            { $project: { email: 1, name: 1 } }
          ]
        },
      },
      {
        $addFields: {
          templateId: { $arrayElemAt: ["$template", 0] },
          sentBy: { $arrayElemAt: ["$sentByUser", 0] },
        },
      },
      {
        $project: {
          templateId: 1,
          templateTitle: 1,
          recipientCount: 1,
          successCount: 1,
          failureCount: 1,
          status: 1,
          sentAt: 1,
          completedAt: 1,
          sentBy: 1,
          recipients: 1,
        },
      },
      { $sort: { sentAt: -1 } }, // Newest first
      { $skip: skip },
      { $limit: limitNum },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        history: emailHistory,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum,
        },
      },
      message: "Email history retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching email history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email history",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Get detailed email history by ID
 * GET /api/admin/email/history/:id
 */
export const getEmailHistoryDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get email history with template and sender details
    const emailHistory = await EmailHistory.findById(id)
      .populate("templateId", "title type content")
      .populate("sentBy", "email name");

    if (!emailHistory) {
      return res.status(404).json({
        success: false,
        message: "Email history not found",
      });
    }

    // Get all recipients for this email with their status
    const recipients = await EmailRecipient.find({ historyId: id })
      .select("buyerId buyerName buyerEmail status error sentAt")
      .sort({ createdAt: 1 }); // Order by creation time

    // Calculate status summary
    const statusSummary = recipients.reduce((acc, recipient) => {
      acc[recipient.status] = (acc[recipient.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      success: true,
      data: {
        history: emailHistory,
        recipients,
        statusSummary: {
          total: recipients.length,
          sent: statusSummary.sent || 0,
          failed: statusSummary.failed || 0,
          pending: statusSummary.pending || 0,
        },
      },
      message: "Email history detail retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching email history detail:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email history detail",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Resend failed emails from a specific email history
 * POST /api/admin/email/history/:id/resend
 */
export const resendFailedEmails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id;

    // Get the original email history
    const originalHistory = await EmailHistory.findById(id).populate(
      "templateId"
    );

    if (!originalHistory) {
      return res.status(404).json({
        success: false,
        message: "Email history not found",
      });
    }

    // Get failed recipients from the original email
    const failedRecipients = await EmailRecipient.find({
      historyId: id,
      status: "failed",
      del_flg: false,
    });

    if (failedRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No failed recipients found to resend",
      });
    }

    // Create new EmailHistory record for the resend operation
    const resendHistory = new EmailHistory({
      templateId: originalHistory.templateId._id,
      templateTitle: `[RESEND] ${originalHistory.templateTitle}`,
      templateContent: originalHistory.templateContent,
      recipientCount: failedRecipients.length,
      successCount: 0,
      failureCount: 0,
      status: "sending",
      sentBy: adminId,
      sentAt: new Date(),
    });

    await resendHistory.save();

    // Create new EmailRecipient records for the resend operation
    const resendRecipients = await Promise.all(
      failedRecipients.map(async (recipient) => {
        return {
          historyId: resendHistory._id,
          buyerId: recipient.buyerId,
          buyerName: recipient.buyerName,
          buyerEmail: recipient.buyerEmail,
          personalizedContent: recipient.personalizedContent, // Use the same personalized content
          status: "pending" as const,
        };
      })
    );

    await EmailRecipient.insertMany(resendRecipients);

    // Prepare recipients data for bulk email processing
    const recipientsForProcessing = failedRecipients.map((recipient) => ({
      _id: recipient.buyerId.toString(),
      email: recipient.buyerEmail,
      name: recipient.buyerName,
      point: 0, // Point value is not critical for resend as content is already personalized
    }));

    // Start resend processing asynchronously using the same bulk email service
    const template = originalHistory.templateId as any; // Template is populated
    processBulkEmail(
      resendHistory._id.toString(),
      template,
      recipientsForProcessing
    ).catch((error) => {
      console.error("Resend email processing failed:", error);
    });

    return res.status(200).json({
      success: true,
      data: {
        resendHistoryId: resendHistory._id,
        originalHistoryId: id,
        recipientCount: failedRecipients.length,
        status: "sending",
        failedRecipients: failedRecipients.map((r) => ({
          buyerName: r.buyerName,
          buyerEmail: r.buyerEmail,
          originalError: r.error,
        })),
      },
      message: `Resending emails to ${failedRecipients.length} failed recipients`,
    });
  } catch (error) {
    console.error("Error resending failed emails:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to resend emails",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
