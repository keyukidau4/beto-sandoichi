/**
 * Email-specific error classes and error handling utilities
 */

export enum EmailErrorCode {
  // Template errors
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  TEMPLATE_VALIDATION_FAILED = 'TEMPLATE_VALIDATION_FAILED',
  TEMPLATE_CREATION_FAILED = 'TEMPLATE_CREATION_FAILED',
  TEMPLATE_UPDATE_FAILED = 'TEMPLATE_UPDATE_FAILED',
  TEMPLATE_DELETE_FAILED = 'TEMPLATE_DELETE_FAILED',
  
  // Recipient errors
  INVALID_EMAIL_ADDRESS = 'INVALID_EMAIL_ADDRESS',
  RECIPIENT_NOT_FOUND = 'RECIPIENT_NOT_FOUND',
  RECIPIENT_LIMIT_EXCEEDED = 'RECIPIENT_LIMIT_EXCEEDED',
  NO_RECIPIENTS_SELECTED = 'NO_RECIPIENTS_SELECTED',
  
  // Sending errors
  SMTP_CONNECTION_FAILED = 'SMTP_CONNECTION_FAILED',
  SMTP_AUTHENTICATION_FAILED = 'SMTP_AUTHENTICATION_FAILED',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  BULK_EMAIL_FAILED = 'BULK_EMAIL_FAILED',
  EMAIL_QUEUE_FULL = 'EMAIL_QUEUE_FULL',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  BULK_EMAIL_RATE_LIMIT = 'BULK_EMAIL_RATE_LIMIT',
  TEMPLATE_RATE_LIMIT = 'TEMPLATE_RATE_LIMIT',
  
  // Security errors
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT_PRIVILEGES',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  CONTENT_SECURITY_VIOLATION = 'CONTENT_SECURITY_VIOLATION',
  
  // System errors
  EMAIL_SERVICE_UNAVAILABLE = 'EMAIL_SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base email error class
 */
export class EmailError extends Error {
  public readonly code: EmailErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: EmailErrorCode,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmailError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.timestamp = new Date();
    this.context = context;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, EmailError.prototype);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case EmailErrorCode.TEMPLATE_NOT_FOUND:
        return 'The requested email template was not found.';
      case EmailErrorCode.RECIPIENT_LIMIT_EXCEEDED:
        return 'Maximum number of recipients exceeded. Please select fewer recipients.';
      case EmailErrorCode.INVALID_EMAIL_ADDRESS:
        return 'One or more email addresses are invalid.';
      case EmailErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please try again later.';
      case EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE:
        return 'Email service is temporarily unavailable. Please try again later.';
      case EmailErrorCode.SMTP_CONNECTION_FAILED:
        return 'Unable to connect to email server. Please try again later.';
      case EmailErrorCode.UNAUTHORIZED_ACCESS:
        return 'You do not have permission to perform this action.';
      default:
        return 'An error occurred while processing your email request.';
    }
  }
}

/**
 * Template-specific errors
 */
export class TemplateError extends EmailError {
  constructor(message: string, code: EmailErrorCode, context?: Record<string, any>) {
    super(message, code, 400, context);
    this.name = 'TemplateError';
  }
}

/**
 * Recipient-specific errors
 */
export class RecipientError extends EmailError {
  constructor(message: string, code: EmailErrorCode, context?: Record<string, any>) {
    super(message, code, 400, context);
    this.name = 'RecipientError';
  }
}

/**
 * SMTP and sending errors
 */
export class SendingError extends EmailError {
  public readonly retryable: boolean;
  public readonly retryAfter?: number;

  constructor(
    message: string, 
    code: EmailErrorCode, 
    retryable: boolean = false,
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(message, code, 500, context);
    this.name = 'SendingError';
    this.retryable = retryable;
    this.retryAfter = retryAfter;
  }
}

/**
 * Security-related errors
 */
export class SecurityError extends EmailError {
  constructor(message: string, code: EmailErrorCode, context?: Record<string, any>) {
    super(message, code, 403, context);
    this.name = 'SecurityError';
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends EmailError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, context?: Record<string, any>) {
    super(message, EmailErrorCode.RATE_LIMIT_EXCEEDED, 429, context);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error factory functions
 */
export const createTemplateError = (message: string, context?: Record<string, any>) => {
  return new TemplateError(message, EmailErrorCode.TEMPLATE_NOT_FOUND, context);
};

export const createRecipientError = (message: string, context?: Record<string, any>) => {
  return new RecipientError(message, EmailErrorCode.INVALID_EMAIL_ADDRESS, context);
};

export const createSendingError = (
  message: string, 
  retryable: boolean = false, 
  retryAfter?: number,
  context?: Record<string, any>
) => {
  return new SendingError(message, EmailErrorCode.EMAIL_SEND_FAILED, retryable, retryAfter, context);
};

export const createSecurityError = (message: string, context?: Record<string, any>) => {
  return new SecurityError(message, EmailErrorCode.UNAUTHORIZED_ACCESS, context);
};

/**
 * Error classification utility
 */
export const classifyError = (error: any): EmailError => {
  if (error instanceof EmailError) {
    return error;
  }

  // MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    return new TemplateError(
      'Validation failed',
      EmailErrorCode.TEMPLATE_VALIDATION_FAILED,
      { originalError: error.message }
    );
  }

  if (error.name === 'CastError') {
    return new EmailError(
      'Invalid data format',
      EmailErrorCode.DATABASE_ERROR,
      400,
      { originalError: error.message }
    );
  }

  // Nodemailer errors
  if (error.code === 'ECONNECTION' || error.code === 'ENOTFOUND') {
    return new SendingError(
      'Failed to connect to email server',
      EmailErrorCode.SMTP_CONNECTION_FAILED,
      true, // retryable
      300, // retry after 5 minutes
      { originalError: error.message, code: error.code }
    );
  }

  if (error.code === 'EAUTH') {
    return new SendingError(
      'Email authentication failed',
      EmailErrorCode.SMTP_AUTHENTICATION_FAILED,
      false, // not retryable
      undefined,
      { originalError: error.message }
    );
  }

  if (error.responseCode >= 400 && error.responseCode < 500) {
    return new SendingError(
      'Email rejected by server',
      EmailErrorCode.EMAIL_SEND_FAILED,
      false, // client errors are not retryable
      undefined,
      { originalError: error.message, responseCode: error.responseCode }
    );
  }

  if (error.responseCode >= 500) {
    return new SendingError(
      'Email server error',
      EmailErrorCode.EMAIL_SEND_FAILED,
      true, // server errors are retryable
      600, // retry after 10 minutes
      { originalError: error.message, responseCode: error.responseCode }
    );
  }

  // Generic error
  return new EmailError(
    error.message || 'Unknown email error',
    EmailErrorCode.UNKNOWN_ERROR,
    500,
    { originalError: error.toString() }
  );
};

/**
 * Error recovery strategies
 */
export interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  shouldRetry: (error: EmailError, attempt: number) => boolean;
}

export const getRetryStrategy = (error: EmailError): RetryStrategy | null => {
  if (error instanceof SendingError && error.retryable) {
    switch (error.code) {
      case EmailErrorCode.SMTP_CONNECTION_FAILED:
        return {
          maxRetries: 3,
          baseDelay: 30000, // 30 seconds
          maxDelay: 300000, // 5 minutes
          backoffMultiplier: 2,
          shouldRetry: (err, attempt) => attempt <= 3 && err.code === EmailErrorCode.SMTP_CONNECTION_FAILED
        };
      
      case EmailErrorCode.EMAIL_SEND_FAILED:
        return {
          maxRetries: 2,
          baseDelay: 60000, // 1 minute
          maxDelay: 600000, // 10 minutes
          backoffMultiplier: 2,
          shouldRetry: (err, attempt) => attempt <= 2 && err instanceof SendingError && err.retryable
        };
      
      case EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE:
        return {
          maxRetries: 5,
          baseDelay: 120000, // 2 minutes
          maxDelay: 900000, // 15 minutes
          backoffMultiplier: 1.5,
          shouldRetry: (err, attempt) => attempt <= 5 && err.code === EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE
        };
      
      default:
        return {
          maxRetries: 1,
          baseDelay: 10000, // 10 seconds
          maxDelay: 60000, // 1 minute
          backoffMultiplier: 1.5,
          shouldRetry: (err, attempt) => attempt <= 1 && err instanceof SendingError && err.retryable
        };
    }
  }

  return null;
};

/**
 * Calculate retry delay with exponential backoff
 */
export const calculateRetryDelay = (
  attempt: number, 
  strategy: RetryStrategy
): number => {
  const delay = Math.min(
    strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attempt - 1),
    strategy.maxDelay
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.floor(delay + jitter);
};

/**
 * Enhanced error recovery mechanism with retry logic
 */
export class ErrorRecoveryManager {
  private retryAttempts: Map<string, number> = new Map();
  private lastAttemptTime: Map<string, Date> = new Map();
  private backoffDelays: Map<string, number> = new Map();

  /**
   * Execute operation with automatic retry logic
   */
  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    errorHandler?: (error: EmailError, attempt: number) => void
  ): Promise<T> {
    const currentAttempt = (this.retryAttempts.get(operationId) || 0) + 1;
    this.retryAttempts.set(operationId, currentAttempt);

    try {
      const result = await operation();
      
      // Success - clear retry tracking
      this.clearRetryTracking(operationId);
      return result;
      
    } catch (error) {
      const emailError = classifyError(error);
      const strategy = getRetryStrategy(emailError);
      
      // Call error handler if provided
      if (errorHandler) {
        errorHandler(emailError, currentAttempt);
      }

      // Check if we should retry
      if (strategy && strategy.shouldRetry(emailError, currentAttempt) && currentAttempt <= strategy.maxRetries) {
        const delay = calculateRetryDelay(currentAttempt, strategy);
        this.backoffDelays.set(operationId, delay);
        this.lastAttemptTime.set(operationId, new Date());

        console.log(`Retrying operation ${operationId} in ${delay}ms (attempt ${currentAttempt}/${strategy.maxRetries})`);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Recursive retry
        return this.executeWithRetry(operationId, operation, errorHandler);
      } else {
        // No more retries - clear tracking and throw error
        this.clearRetryTracking(operationId);
        throw emailError;
      }
    }
  }

  /**
   * Check if operation is currently in backoff period
   */
  isInBackoff(operationId: string): boolean {
    const lastAttempt = this.lastAttemptTime.get(operationId);
    const backoffDelay = this.backoffDelays.get(operationId);
    
    if (!lastAttempt || !backoffDelay) {
      return false;
    }

    const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
    return timeSinceLastAttempt < backoffDelay;
  }

  /**
   * Get retry information for operation
   */
  getRetryInfo(operationId: string): {
    attempts: number;
    lastAttempt?: Date;
    nextAttemptIn?: number;
    inBackoff: boolean;
  } {
    const attempts = this.retryAttempts.get(operationId) || 0;
    const lastAttempt = this.lastAttemptTime.get(operationId);
    const backoffDelay = this.backoffDelays.get(operationId);
    const inBackoff = this.isInBackoff(operationId);
    
    let nextAttemptIn: number | undefined;
    if (inBackoff && lastAttempt && backoffDelay) {
      const timeSinceLastAttempt = Date.now() - lastAttempt.getTime();
      nextAttemptIn = Math.max(0, backoffDelay - timeSinceLastAttempt);
    }

    return {
      attempts,
      lastAttempt,
      nextAttemptIn,
      inBackoff
    };
  }

  /**
   * Clear retry tracking for operation
   */
  private clearRetryTracking(operationId: string): void {
    this.retryAttempts.delete(operationId);
    this.lastAttemptTime.delete(operationId);
    this.backoffDelays.delete(operationId);
  }

  /**
   * Clear all retry tracking (for cleanup)
   */
  clearAllRetryTracking(): void {
    this.retryAttempts.clear();
    this.lastAttemptTime.clear();
    this.backoffDelays.clear();
  }

  /**
   * Get all active retry operations
   */
  getActiveRetries(): Array<{
    operationId: string;
    attempts: number;
    lastAttempt: Date;
    inBackoff: boolean;
  }> {
    const activeRetries: Array<{
      operationId: string;
      attempts: number;
      lastAttempt: Date;
      inBackoff: boolean;
    }> = [];

    for (const [operationId, attempts] of this.retryAttempts.entries()) {
      const lastAttempt = this.lastAttemptTime.get(operationId);
      if (lastAttempt) {
        activeRetries.push({
          operationId,
          attempts,
          lastAttempt,
          inBackoff: this.isInBackoff(operationId)
        });
      }
    }

    return activeRetries;
  }
}

// Export singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();