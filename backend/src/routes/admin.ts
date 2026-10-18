import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateObjectId } from '../middleware/validation';
import { adminLimiter } from '../middleware/security';
import { emailTemplateSchema } from '../utils/validation';
import Joi from 'joi';
import { 
  getAnalytics,
  getEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
  sendEmailToUsers,
  getUsersForEmail
} from '../controllers/adminController';

const router = express.Router();

// Apply admin-specific rate limiting to all routes
router.use(adminLimiter);

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// Email sending validation schema
const sendEmailSchema = Joi.object({
  templateId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid template ID format',
      'any.required': 'Template ID is required'
    }),
  userIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid user ID format'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one user must be selected',
      'any.required': 'User IDs are required'
    })
});

/**
 * Admin Routes
 * All routes require admin authentication and rate limiting
 */

// Analytics Routes
router.get('/analytics', getAnalytics);

// Email Template Routes
router.get('/email-templates', getEmailTemplates);
router.get('/email-templates/:id', validateObjectId(), getEmailTemplate);
router.post('/email-templates', validateBody(emailTemplateSchema), createEmailTemplate);
router.put('/email-templates/:id', validateObjectId(), validateBody(emailTemplateSchema), updateEmailTemplate);
router.delete('/email-templates/:id', validateObjectId(), deleteEmailTemplate);
router.post('/email-templates/:id/preview', validateObjectId(), previewEmailTemplate);

// Email Sending Routes
router.post('/send-email', validateBody(sendEmailSchema), sendEmailToUsers);
router.get('/users-for-email', getUsersForEmail);

export default router;