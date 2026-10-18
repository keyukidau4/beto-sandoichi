import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { createValidationError } from './errorHandler';

/**
 * Middleware factory for validating request data using Joi schemas
 */
export const validateRequest = (schema: Schema, property: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return next(createValidationError(errorMessages.join(', ')));
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Middleware for validating request body
 */
export const validateBody = (schema: Schema) => validateRequest(schema, 'body');

/**
 * Middleware for validating request params
 */
export const validateParams = (schema: Schema) => validateRequest(schema, 'params');

/**
 * Middleware for validating request query
 */
export const validateQuery = (schema: Schema) => validateRequest(schema, 'query');

/**
 * Middleware for validating MongoDB ObjectId parameters
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id) {
      return next(createValidationError(`${paramName} parameter is required`));
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(id)) {
      return next(createValidationError(`Invalid ${paramName} format`));
    }

    next();
  };
};

/**
 * Middleware for sanitizing input data
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize object properties
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};