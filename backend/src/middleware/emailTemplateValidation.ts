import { Request, Response, NextFunction } from 'express';
import { validateEmailTemplate } from '../utils/validation';
import { validatePlaceholders } from '../utils/templateRenderer';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Email template validation middleware
 * Validates and sanitizes email template data before processing
 */
export const validateEmailTemplateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, type } = req.body;

    // Basic validation using Joi schema
    const { error, value } = validateEmailTemplate({ title, content, type });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // Additional content validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email content cannot be empty'
      });
    }

    // Sanitize HTML content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 'a', 'div', 'span', 'img'
      ],
      ALLOWED_ATTR: ['href', 'target', 'style', 'src', 'alt', 'width', 'height']
    });

    // Validate placeholders in template content
    const placeholderValidation = validatePlaceholders(sanitizedContent);

    if (!placeholderValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid placeholders found in template content',
        error: `Invalid placeholders: ${placeholderValidation.invalidPlaceholders.join(', ')}`,
        validPlaceholders: placeholderValidation.validPlaceholders,
        invalidPlaceholders: placeholderValidation.invalidPlaceholders
      });
    }

    // Add sanitized content and validation results to request
    req.body.sanitizedContent = sanitizedContent;
    req.body.placeholderValidation = placeholderValidation;
    req.body.validatedData = value;

    return next();
  } catch (error) {
    console.error('Email template validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Template validation failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * Email template update validation middleware
 * Similar to create validation but allows for partial updates
 */
export const validateEmailTemplateUpdateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, type } = req.body;

    // Check if at least one field is provided for update
    if (!title && !content && !type) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (title, content, or type) must be provided for update'
      });
    }

    // Validate provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;

    const { error, value } = validateEmailTemplate(updateData);

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    // If content is being updated, sanitize and validate placeholders
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email content cannot be empty'
        });
      }

      // Sanitize HTML content
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'ul', 'ol', 'li', 'a', 'div', 'span', 'img'
        ],
        ALLOWED_ATTR: ['href', 'target', 'style', 'src', 'alt', 'width', 'height']
      });

      // Validate placeholders
      const placeholderValidation = validatePlaceholders(sanitizedContent);

      if (!placeholderValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid placeholders found in template content',
          error: `Invalid placeholders: ${placeholderValidation.invalidPlaceholders.join(', ')}`,
          validPlaceholders: placeholderValidation.validPlaceholders,
          invalidPlaceholders: placeholderValidation.invalidPlaceholders
        });
      }

      req.body.sanitizedContent = sanitizedContent;
      req.body.placeholderValidation = placeholderValidation;
    }

    req.body.validatedData = value;
    return next();
  } catch (error) {
    console.error('Email template update validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Template validation failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};