import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateObjectId } from '../middleware/validation';
import { adminLimiter } from '../middleware/security';
import { validateEmailTemplateMiddleware, validateEmailTemplateUpdateMiddleware } from '../middleware/emailTemplateValidation';
import {
  bulkEmailRateLimit,
  templateRateLimit,
  previewRateLimit,
  validateEmailAddresses,
  sanitizeEmailContent,
  validateRecipientLimit,
  requireEmailManagementAuth,
  validateEmailTemplateInput,
  monitorEmailActivity
} from '../middleware/emailSecurity';
import {
  emailOperationTracker,
  emailErrorHandler,
  emailHealthCheck,
  emailRateLimitWithMonitoring
} from '../middleware/emailErrorMonitoring';
import {
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  getEmailRecipients,
  sendBulkEmail,
  getBulkEmailSendProgress,
  getBulkEmailSendStatus,
  getEmailHistory,
  getEmailHistoryDetail,
  resendFailedEmails,
  getEmailServiceHealth,
  getEmailServiceMetrics
} from '../controllers/emailController';

const router = express.Router();

// Apply admin-specific rate limiting to all routes
router.use(adminLimiter);

// All routes require enhanced email management authentication
router.use(authenticate, authorize('admin'), requireEmailManagementAuth);

// Check email service health before processing requests
// router.use(emailHealthCheck);

// Apply enhanced rate limiting with monitoring
// router.use(emailRateLimitWithMonitoring);

// Monitor all email management activities
// router.use(monitorEmailActivity);

// Email template validation is now handled by dedicated middleware

/**
 * Email Template Management Routes
 * All routes require admin authentication and rate limiting
 */

// GET /api/admin/email/templates - Get all email templates
router.get('/templates', 
  emailOperationTracker('template_list'),
  getEmailTemplates
);

// GET /api/admin/email/templates/:id - Get email template by ID
router.get('/templates/:id', 
  validateObjectId(), 
  emailOperationTracker('template_get'),
  getEmailTemplate
);

// POST /api/admin/email/templates - Create new email template
router.post('/templates', 
  templateRateLimit,
  emailOperationTracker('template_create'),
  validateEmailTemplateInput,
  sanitizeEmailContent,
  validateEmailTemplateMiddleware, 
  createEmailTemplate,
  emailErrorHandler
);

// PUT /api/admin/email/templates/:id - Update email template
router.put('/templates/:id', 
  validateObjectId(), 
  templateRateLimit,
  emailOperationTracker('template_update'),
  validateEmailTemplateInput,
  sanitizeEmailContent,
  validateEmailTemplateUpdateMiddleware, 
  updateEmailTemplate,
  emailErrorHandler
);

// DELETE /api/admin/email/templates/:id - Soft delete email template
router.delete('/templates/:id', 
  validateObjectId(), 
  emailOperationTracker('template_delete'),
  deleteEmailTemplate,
  emailErrorHandler
);

// POST /api/admin/email/templates/:id/preview - Preview email template with sample data
router.post('/templates/:id/preview', 
  validateObjectId(), 
  previewRateLimit, 
  emailOperationTracker('template_preview'),
  previewEmailTemplate,
  emailErrorHandler
);

/**
 * Bulk Email Management Routes
 * All routes require admin authentication and rate limiting
 */

// GET /api/admin/email/recipients - Get available buyers for email sending
router.get('/recipients', 
  emailOperationTracker('recipients_list'),
  getEmailRecipients
);

// POST /api/admin/email/send-bulk - Send bulk email to selected recipients
router.post('/send-bulk', 
  bulkEmailRateLimit,
  emailOperationTracker('bulk_email_send'),
  validateEmailAddresses,
  validateRecipientLimit,
  sendBulkEmail,
  emailErrorHandler
);

// GET /api/admin/email/send-progress/:id - Get bulk email sending progress (detailed)
router.get('/send-progress/:id', 
  validateObjectId(), 
  emailOperationTracker('bulk_email_progress'),
  getBulkEmailSendProgress
);

// GET /api/admin/email/send-status/:id - Get bulk email sending status (lightweight for real-time updates)
router.get('/send-status/:id', 
  validateObjectId(), 
  emailOperationTracker('bulk_email_status'),
  getBulkEmailSendStatus
);

/**
 * Email History Management Routes
 * All routes require admin authentication and rate limiting
 */

// GET /api/admin/email/history - Get email history with pagination and filtering
router.get('/history', 
  emailOperationTracker('email_history_list'),
  getEmailHistory
);

// GET /api/admin/email/history/:id - Get detailed email history by ID
router.get('/history/:id', 
  validateObjectId(), 
  emailOperationTracker('email_history_detail'),
  getEmailHistoryDetail
);

// POST /api/admin/email/history/:id/resend - Resend failed emails from a specific email history
router.post('/history/:id/resend', 
  validateObjectId(), 
  bulkEmailRateLimit,
  emailOperationTracker('email_resend'),
  resendFailedEmails,
  emailErrorHandler
);

/**
 * Email Service Health and Monitoring Routes
 */

// GET /api/admin/email/health - Get email service health status
router.get('/health', 
  emailOperationTracker('service_health'),
  getEmailServiceHealth
);

// GET /api/admin/email/metrics - Get email service metrics
router.get('/metrics', 
  emailOperationTracker('service_metrics'),
  getEmailServiceMetrics
);

export default router;