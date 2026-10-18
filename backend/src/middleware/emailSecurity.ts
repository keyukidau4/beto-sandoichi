import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Email-specific rate limiting configurations
 */

// Rate limiting for bulk email operations (stricter than general admin limiter)
export const bulkEmailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each admin to 5 bulk emails per 15 minutes
  message: {
    success: false,
    message: 'Too many bulk email requests. Please try again later.',
    code: 'BULK_EMAIL_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use admin user ID for rate limiting instead of IP
    return req.user?._id?.toString() || req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for system/automated emails
    return req.headers['x-system-email'] === 'true';
  }
});

// Rate limiting for email template operations
export const templateRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each admin to 20 template operations per 10 minutes
  message: {
    success: false,
    message: 'Too many template operations. Please try again later.',
    code: 'TEMPLATE_RATE_LIMIT_EXCEEDED',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?._id?.toString() || req.ip;
  }
});

// Rate limiting for email preview operations
export const previewRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // limit each admin to 30 preview requests per 5 minutes
  message: {
    success: false,
    message: 'Too many preview requests. Please try again later.',
    code: 'PREVIEW_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?._id?.toString() || req.ip;
  }
});

/**
 * Email address validation middleware
 */
export const validateEmailAddresses = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientIds, recipients } = req.body;

    console.log({recipientIds});
    console.log({recipients});
    

    // For bulk email sending, validate recipient emails
    if (recipientIds && Array.isArray(recipientIds)) {
      // This will be validated against actual user emails in the controller
      // Just check if recipientIds is a valid array
      if (recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one recipient must be selected',
          code: 'NO_RECIPIENTS_SELECTED'
        });
      }

      if (recipientIds.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 recipients allowed per bulk email',
          code: 'RECIPIENT_LIMIT_EXCEEDED'
        });
      }
    }

    // For direct email addresses (if provided)
    if (recipients && Array.isArray(recipients)) {
      const invalidEmails: string[] = [];
      
      recipients.forEach((email: string) => {
        if (typeof email !== 'string' || !validator.isEmail(email.trim())) {
          invalidEmails.push(email);
        }
      });

      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email addresses found',
          code: 'INVALID_EMAIL_ADDRESSES',
          invalidEmails
        });
      }

      if (recipients.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 recipients allowed per bulk email',
          code: 'RECIPIENT_LIMIT_EXCEEDED'
        });
      }
    }

    return next();
  } catch (error) {
    console.error('Email address validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email validation failed',
      code: 'EMAIL_VALIDATION_ERROR'
    });
  }
};

/**
 * Enhanced HTML content sanitization for email templates
 */
export const sanitizeEmailContent = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;

    if (content && typeof content === 'string') {
      // Enhanced sanitization configuration for email content
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          // Text formatting
          'p', 'br', 'strong', 'em', 'u', 'b', 'i',
          // Headers
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          // Lists
          'ul', 'ol', 'li',
          // Links and images
          'a', 'img',
          // Layout
          'div', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead',
          // Email-specific
          'center', 'font'
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'src', 'alt', 'width', 'height',
          'style', 'class', 'id', 'title',
          // Email-specific attributes
          'color', 'size', 'face', 'align', 'valign',
          'cellpadding', 'cellspacing', 'border'
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        // Remove potentially dangerous attributes
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        // Remove script-related tags
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select'],
        // Keep whitespace for email formatting
        KEEP_CONTENT: true,
        // Allow data URIs for inline images (with size limit)
        ALLOW_DATA_ATTR: false
      });

      // Additional security checks
      if (sanitizedContent.length > 100000) { // 100KB limit for email content
        return res.status(400).json({
          success: false,
          message: 'Email content is too large. Maximum size is 100KB.',
          code: 'CONTENT_TOO_LARGE'
        });
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/gi,
        /vbscript:/gi,
        /data:text\/html/gi,
        /data:application/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<form/gi
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitizedContent)) {
          return res.status(400).json({
            success: false,
            message: 'Email content contains potentially dangerous elements',
            code: 'DANGEROUS_CONTENT_DETECTED'
          });
        }
      }

      // Store sanitized content
      req.body.sanitizedContent = sanitizedContent;
    }

    return next();
  } catch (error) {
    console.error('Email content sanitization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Content sanitization failed',
      code: 'SANITIZATION_ERROR'
    });
  }
};

/**
 * Recipient limit validation middleware
 */
export const validateRecipientLimit = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientIds, recipients } = req.body;
    const maxRecipients = 10;

    let recipientCount = 0;

    if (recipientIds && Array.isArray(recipientIds)) {
      recipientCount = recipientIds.length;
    } else if (recipients && Array.isArray(recipients)) {
      recipientCount = recipients.length;
    }

    if (recipientCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient must be specified',
        code: 'NO_RECIPIENTS'
      });
    }

    if (recipientCount > maxRecipients) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxRecipients} recipients allowed per bulk email`,
        code: 'RECIPIENT_LIMIT_EXCEEDED',
        maxAllowed: maxRecipients,
        provided: recipientCount
      });
    }

    return next();
  } catch (error) {
    console.error('Recipient limit validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Recipient validation failed',
      code: 'RECIPIENT_VALIDATION_ERROR'
    });
  }
};

/**
 * Enhanced authentication check for email management endpoints
 */
export const requireEmailManagementAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for email management',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required for email management',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }

    // Check if user account is active
    if (req.user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Account must be approved to access email management',
        code: 'ACCOUNT_NOT_APPROVED'
      });
    }

    // Log email management access for security monitoring
    console.log(`Email management access: Admin ${req.user._id} (${req.user.email}) accessed ${req.method} ${req.path}`);

    return next();
  } catch (error) {
    console.error('Email management authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication check failed',
      code: 'AUTH_CHECK_ERROR'
    });
  }
};

/**
 * Input validation for email template fields
 */
export const validateEmailTemplateInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, type } = req.body;

    // Validate title
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Title must be a string',
          code: 'INVALID_TITLE_TYPE'
        });
      }

      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty',
          code: 'EMPTY_TITLE'
        });
      }

      if (trimmedTitle.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 200 characters',
          code: 'TITLE_TOO_LONG'
        });
      }

      // Check for suspicious patterns in title
      const suspiciousPatterns = [/<script/gi, /javascript:/gi, /on\w+=/gi];
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(trimmedTitle)) {
          return res.status(400).json({
            success: false,
            message: 'Title contains invalid characters',
            code: 'INVALID_TITLE_CONTENT'
          });
        }
      }

      req.body.title = trimmedTitle;
    }

    // Validate type
    if (type !== undefined) {
      const validTypes = [
        'approval',
        'general', 
        'promotion',
        'order_confirmation',
        'status_update',
        'point_notification'
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid template type',
          code: 'INVALID_TEMPLATE_TYPE',
          validTypes
        });
      }
    }

    return next();
  } catch (error) {
    console.error('Email template input validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Input validation failed',
      code: 'INPUT_VALIDATION_ERROR'
    });
  }
};

/**
 * Security monitoring middleware for suspicious email activity
 */
export const monitorEmailActivity = (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?._id;
    const adminEmail = req.user?.email;
    const action = `${req.method} ${req.path}`;
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent');
    const ip = req.ip;

    // Log all email management activities
    console.log(`[EMAIL_SECURITY] ${timestamp} - Admin: ${adminId} (${adminEmail}) - Action: ${action} - IP: ${ip} - UserAgent: ${userAgent}`);

    // Check for suspicious patterns
    const suspiciousIndicators = [];

    // Check for rapid successive requests (potential automation)
    const requestKey = `email_requests_${adminId}`;
    // In a production environment, you would use Redis or similar for this
    // For now, we'll just log the activity

    // Check for unusual request patterns
    if (req.body && typeof req.body === 'object') {
      const bodyString = JSON.stringify(req.body);
      
      // Check for very large payloads
      if (bodyString.length > 50000) {
        suspiciousIndicators.push('LARGE_PAYLOAD');
      }

      // Check for suspicious content patterns
      const suspiciousPatterns = [
        /script/gi,
        /eval\(/gi,
        /function\(/gi,
        /\.exe/gi,
        /\.bat/gi,
        /cmd\.exe/gi
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(bodyString)) {
          suspiciousIndicators.push('SUSPICIOUS_CONTENT');
          break;
        }
      }
    }

    // Log suspicious activity
    if (suspiciousIndicators.length > 0) {
      console.warn(`[EMAIL_SECURITY_ALERT] ${timestamp} - Admin: ${adminId} (${adminEmail}) - Suspicious indicators: ${suspiciousIndicators.join(', ')} - Action: ${action}`);
    }

    next();
  } catch (error) {
    console.error('Email activity monitoring error:', error);
    // Don't block the request if monitoring fails
    next();
  }
};