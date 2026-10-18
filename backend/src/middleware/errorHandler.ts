import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';

// Custom error class for application errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types for better categorization
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
} as const;

// Helper functions to create specific error types
export const createValidationError = (message: string) => 
  new AppError(message, 400, ErrorTypes.VALIDATION_ERROR);

export const createAuthenticationError = (message: string = 'Authentication required') => 
  new AppError(message, 401, ErrorTypes.AUTHENTICATION_ERROR);

export const createAuthorizationError = (message: string = 'Insufficient permissions') => 
  new AppError(message, 403, ErrorTypes.AUTHORIZATION_ERROR);

export const createNotFoundError = (resource: string) => 
  new AppError(`${resource} not found`, 404, ErrorTypes.NOT_FOUND_ERROR);

export const createDuplicateError = (field: string) => 
  new AppError(`${field} already exists`, 409, ErrorTypes.DUPLICATE_ERROR);

export const createInsufficientStockError = (productName: string) => 
  new AppError(`Insufficient stock for ${productName}`, 400, ErrorTypes.INSUFFICIENT_STOCK);

export const createInsufficientPointsError = () => 
  new AppError('Insufficient points for this purchase', 400, ErrorTypes.INSUFFICIENT_POINTS);

export const createPaymentError = (message: string) => 
  new AppError(message, 400, ErrorTypes.PAYMENT_ERROR);

export const createUploadError = (message: string) => 
  new AppError(message, 400, ErrorTypes.UPLOAD_ERROR);

export const createDatabaseError = (message: string = 'Database operation failed') => 
  new AppError(message, 500, ErrorTypes.DATABASE_ERROR);

export const createExternalServiceError = (service: string) => 
  new AppError(`${service} service is currently unavailable`, 503, ErrorTypes.EXTERNAL_SERVICE_ERROR);

// Handle Joi validation errors
const handleJoiValidationError = (error: ValidationError): AppError => {
  const messages = error.details.map(detail => detail.message).join(', ');
  return createValidationError(messages);
};

// Handle MongoDB duplicate key errors
const handleMongoDuplicateError = (error: any): AppError => {
  const field = Object.keys(error.keyValue)[0];
  return createDuplicateError(field);
};

// Handle MongoDB cast errors
const handleMongoCastError = (error: any): AppError => {
  return createValidationError(`Invalid ${error.path}: ${error.value}`);
};

// Handle MongoDB validation errors
const handleMongoValidationError = (error: any): AppError => {
  const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
  return createValidationError(messages);
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: 'error',
    error: err,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      code: ErrorTypes.INTERNAL_SERVER_ERROR
    });
  }
};

// Global error handling middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'ValidationError' && err.details) {
      error = handleJoiValidationError(err);
    } else if (err.code === 11000) {
      error = handleMongoDuplicateError(err);
    } else if (err.name === 'CastError') {
      error = handleMongoCastError(err);
    } else if (err.name === 'ValidationError' && err.errors) {
      error = handleMongoValidationError(err);
    } else if (err.name === 'JsonWebTokenError') {
      error = createAuthenticationError('Invalid token');
    } else if (err.name === 'TokenExpiredError') {
      error = createAuthenticationError('Token expired');
    } else if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        error = createUploadError('File too large. Maximum size is 3MB');
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        error = createUploadError('Too many files uploaded');
      } else {
        error = createUploadError('File upload error');
      }
    }

    sendErrorProd(error, res);
  }
};

// Async error wrapper to catch async errors
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled routes
export const handleNotFound = (req: Request, res: Response, next: NextFunction) => {
  const err = createNotFoundError(`Route ${req.originalUrl}`);
  next(err);
};

// Request logging middleware for debugging
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    if (logLevel === 'error') {
      console.log(`Request body:`, req.body);
      console.log(`Request params:`, req.params);
      console.log(`Request query:`, req.query);
    }
  });
  
  next();
};