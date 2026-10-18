import { Request, Response, NextFunction } from 'express';
import { EmailError, EmailErrorCode } from '../utils/emailErrors';
import { emailLogger } from '../services/emailLoggingService';
import { emailHealthMonitor } from '../services/emailHealthMonitor';
import { emailErrorRecoveryService } from '../services/emailErrorRecoveryService';

/**
 * Enhanced email error monitoring middleware
 * Provides comprehensive error tracking, suspicious activity detection, and automatic response
 */

export interface EmailRequestContext {
  adminId?: string;
  adminEmail?: string;
  operation: string;
  templateId?: string;
  recipientCount?: number;
  recipientEmails?: string[];
  startTime: number;
}

/**
 * Middleware to track email operations and detect suspicious patterns
 */
export const emailOperationTracker = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const adminId = (req as any).user?.id;
    const adminEmail = (req as any).user?.email;

    // Create operation context
    const context: EmailRequestContext = {
      adminId,
      adminEmail,
      operation,
      startTime
    };

    // Extract operation-specific data
    switch (operation) {
      case 'bulk_email_send':
        context.templateId = req.body.templateId;
        context.recipientEmails = req.body.recipients;
        context.recipientCount = req.body.recipients?.length || 0;
        break;
      
      case 'template_create':
      case 'template_update':
        context.templateId = req.params.id || 'new';
        break;
      
      case 'template_preview':
        context.templateId = req.params.id;
        break;
    }

    // Store context in request for later use
    (req as any).emailContext = context;

    // Log operation start
    emailLogger.logSuccess(
      `EMAIL_OPERATION_STARTED: ${operation.toUpperCase()}`,
      adminId,
      adminEmail,
      context
    );

    // Check for suspicious patterns before processing
    const anomalies = emailLogger.detectAnomalies(adminId);
    if (anomalies.riskLevel === 'critical') {
      emailLogger.logSuspiciousActivityDetailed(
        `Critical risk detected for operation: ${operation}`,
        'critical',
        adminId,
        adminEmail,
        {
          operation,
          anomalies,
          requestBody: req.body,
          requestParams: req.params
        },
        'Operation blocked due to critical risk level'
      );

      return res.status(403).json({
        success: false,
        message: 'Operation blocked due to security concerns',
        code: EmailErrorCode.SUSPICIOUS_ACTIVITY,
        riskLevel: anomalies.riskLevel,
        recommendations: anomalies.recommendations
      });
    }

    if (anomalies.riskLevel === 'high') {
      emailLogger.logSuspiciousActivityDetailed(
        `High risk detected for operation: ${operation}`,
        'high',
        adminId,
        adminEmail,
        {
          operation,
          anomalies,
          requestBody: req.body,
          requestParams: req.params
        },
        'Operation allowed with enhanced monitoring'
      );
    }

    // Override res.json to capture response and calculate duration
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;

      // Log operation completion
      if (success) {
        emailLogger.logSuccess(
          `EMAIL_OPERATION_COMPLETED: ${operation.toUpperCase()}`,
          adminId,
          adminEmail,
          {
            ...context,
            duration,
            statusCode: res.statusCode,
            responseSize: JSON.stringify(body).length
          },
          duration
        );
      } else {
        emailLogger.logError(
          `EMAIL_OPERATION_FAILED: ${operation.toUpperCase()}`,
          new EmailError(
            body.message || 'Operation failed',
            body.code || EmailErrorCode.UNKNOWN_ERROR
          ),
          adminId,
          adminEmail,
          undefined,
          {
            ...context,
            duration,
            statusCode: res.statusCode,
            errorResponse: body
          }
        );
      }

      return originalJson.call(this, body);
    };

    return next();
  };
};

/**
 * Middleware to handle email-specific errors with comprehensive logging and recovery
 */
export const emailErrorHandler = async (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const context = (req as any).emailContext as EmailRequestContext;
  const emailError = error instanceof EmailError ? error : 
    new EmailError(error.message || 'Unknown email error', EmailErrorCode.UNKNOWN_ERROR);

  const duration = context ? Date.now() - context.startTime : 0;

  // Log the error with full context
  emailLogger.logError(
    `EMAIL_ERROR_HANDLER: ${context?.operation?.toUpperCase() || 'UNKNOWN_OPERATION'}`,
    emailError,
    context?.adminId,
    context?.adminEmail,
    context?.recipientEmails?.[0],
    {
      ...context,
      duration,
      requestUrl: req.originalUrl,
      requestMethod: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      stack: error.stack
    }
  );

  // Record failure for health monitoring
  emailHealthMonitor.recordFailure(emailError);

  // Check if this error indicates suspicious activity
  await checkForSuspiciousActivity(emailError, context, req);

  // Attempt automatic error recovery if applicable
  let recoveryResult = null;
  if (context && shouldAttemptRecovery(emailError, context)) {
    try {
      recoveryResult = await emailErrorRecoveryService.recoverFromError(
        emailError,
        {
          operationId: `${context.operation}_${Date.now()}`,
          adminId: context.adminId,
          adminEmail: context.adminEmail,
          templateId: context.templateId
        },
        {
          enableRetry: false, // Don't retry in middleware
          enableGracefulDegradation: true,
          enableFallback: false
        }
      );
    } catch (recoveryError) {
      let message = ''
      if(recoveryError instanceof Error) {
        message = recoveryError.message
      }

      emailLogger.logError(
        'EMAIL_ERROR_RECOVERY_MIDDLEWARE_FAILED',
        recoveryError instanceof EmailError ? recoveryError : 
          new EmailError(message, EmailErrorCode.UNKNOWN_ERROR),
        context?.adminId,
        context?.adminEmail,
        undefined,
        { originalError: emailError.message, context }
      );
    }
  }

  // Determine response based on error type and recovery result
  const response = buildErrorResponse(emailError, recoveryResult, context);
  
  res.status(response.statusCode).json(response.body);
};

/**
 * Check for suspicious activity patterns
 */
async function checkForSuspiciousActivity(
  error: EmailError,
  context: EmailRequestContext | undefined,
  req: Request
): Promise<void> {
  if (!context) return;

  const suspiciousPatterns: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Check for security-related errors
  if (error.code === EmailErrorCode.UNAUTHORIZED_ACCESS ||
      error.code === EmailErrorCode.CONTENT_SECURITY_VIOLATION) {
    suspiciousPatterns.push('Security violation detected');
    severity = 'critical';
  }

  // Check for repeated failures from same admin
  const recentErrors = emailLogger.getErrorLogs(
    new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
    new Date(),
    error.code
  ).filter(log => log.adminId === context.adminId);

  if (recentErrors.length > 5) {
    suspiciousPatterns.push(`Repeated ${error.code} errors (${recentErrors.length} in 15 minutes)`);
    severity = severity === 'critical' ? 'critical' : 'high';
  }

  // Check for unusual bulk email patterns
  if (context.operation === 'bulk_email_send' && context.recipientCount && context.recipientCount >= 10) {
    const recentBulkEmails = emailLogger.getRecentLogs(50, 'info')
      .filter(log => 
        log.adminId === context.adminId && 
        log.action.includes('BULK_EMAIL') &&
        log.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
      );

    if (recentBulkEmails.length > 3) {
      suspiciousPatterns.push(`Excessive bulk email activity (${recentBulkEmails.length} operations in 1 hour)`);
      severity = severity === 'critical' ? 'critical' : 'medium';
    }
  }

  // Check for off-hours activity
  const currentHour = new Date().getHours();
  if (currentHour < 6 || currentHour > 22) {
    suspiciousPatterns.push('Off-hours activity detected');
    severity = severity === 'critical' || severity === 'high' ? severity : 'low';
  }

  // Log suspicious activity if patterns detected
  if (suspiciousPatterns.length > 0) {
    emailLogger.logSuspiciousActivityDetailed(
      `Suspicious activity during ${context.operation}: ${suspiciousPatterns.join(', ')}`,
      severity,
      context.adminId,
      context.adminEmail,
      {
        operation: context.operation,
        error: error.code,
        patterns: suspiciousPatterns,
        requestUrl: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
  }
}

/**
 * Determine if automatic recovery should be attempted
 */
function shouldAttemptRecovery(error: EmailError, context: EmailRequestContext): boolean {
  // Don't attempt recovery for security violations
  if (error.code === EmailErrorCode.SUSPICIOUS_ACTIVITY ||
      error.code === EmailErrorCode.CONTENT_SECURITY_VIOLATION ||
      error.code === EmailErrorCode.UNAUTHORIZED_ACCESS) {
    return false;
  }

  // Don't attempt recovery for validation errors
  if (error.code === EmailErrorCode.INVALID_EMAIL_ADDRESS ||
      error.code === EmailErrorCode.RECIPIENT_LIMIT_EXCEEDED ||
      error.code === EmailErrorCode.TEMPLATE_VALIDATION_FAILED) {
    return false;
  }

  // Attempt recovery for service-related errors
  return error.code === EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE ||
         error.code === EmailErrorCode.SMTP_CONNECTION_FAILED ||
         error.code === EmailErrorCode.CONFIGURATION_ERROR;
}

/**
 * Build appropriate error response
 */
function buildErrorResponse(
  error: EmailError,
  recoveryResult: any,
  context: EmailRequestContext | undefined
): { statusCode: number; body: any } {
  const baseResponse = {
    success: false,
    message: error.getUserMessage(),
    code: error.code,
    timestamp: new Date().toISOString()
  };

  // Add recovery information if available
  if (recoveryResult) {
    (baseResponse as any).recovery = {
      attempted: true,
      successful: recoveryResult.recovered,
      strategy: recoveryResult.strategy,
      message: recoveryResult.message,
      nextAction: recoveryResult.nextAction
    };
  }

  // Add degradation information for service availability issues
  if (error.code === EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE ||
      error.code === EmailErrorCode.SMTP_CONNECTION_FAILED) {
    const degradationOptions = emailHealthMonitor.getDegradationOptions();
    (baseResponse as any).serviceStatus = {
      available: degradationOptions.canSendEmail,
      degraded: !degradationOptions.canSendBulkEmail,
      features: {
        singleEmail: degradationOptions.canSendEmail,
        bulkEmail: degradationOptions.canSendBulkEmail,
        templatePreview: degradationOptions.canPreviewTemplate,
        automatedEmail: degradationOptions.canSendAutomatedEmail
      },
      recommendation: degradationOptions.recommendedAction
    };
  }

  // Add development information in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    (baseResponse as any).debug = {
      originalError: error.message,
      context,
      stack: error.stack
    };
  }

  return {
    statusCode: error.statusCode || 500,
    body: baseResponse
  };
}

/**
 * Middleware to check email service health before processing requests
 */
export const emailHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  const healthStatus = emailHealthMonitor.getHealthStatus();
  const degradationOptions = emailHealthMonitor.getDegradationOptions();

  // Block requests if service is completely unavailable
  if (healthStatus.status === 'unhealthy' && !degradationOptions.canSendEmail) {
    const error = new EmailError(
      'Email service is currently unavailable',
      EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE
    );

    emailLogger.logError(
      'EMAIL_SERVICE_HEALTH_CHECK_FAILED',
      error,
      (req as any).user?.id,
      (req as any).user?.email,
      undefined,
      {
        requestUrl: req.originalUrl,
        healthStatus,
        degradationOptions
      }
    );

    return res.status(503).json({
      success: false,
      message: 'Email service is temporarily unavailable',
      code: EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE,
      serviceStatus: {
        status: healthStatus.status,
        recommendation: degradationOptions.recommendedAction,
        retryAfter: 300 // 5 minutes
      }
    });
  }

  // Add health status to request context
  (req as any).emailHealthStatus = healthStatus;
  (req as any).emailDegradationOptions = degradationOptions;

  return next();
};

/**
 * Rate limiting with suspicious activity detection
 */
export const emailRateLimitWithMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const adminId = (req as any).user?.id;
  const adminEmail = (req as any).user?.email;

  // Check current rate limit status
  const anomalies = emailLogger.detectAnomalies(adminId);
  
  if (anomalies.rapidRequests) {
    emailLogger.logSuspiciousActivityDetailed(
      'Rate limit exceeded - rapid requests detected',
      'medium',
      adminId,
      adminEmail,
      {
        requestUrl: req.originalUrl,
        anomalies,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      'Request blocked due to rate limiting'
    );

    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      code: EmailErrorCode.RATE_LIMIT_EXCEEDED,
      retryAfter: 60,
      riskLevel: anomalies.riskLevel,
      recommendations: anomalies.recommendations
    });
  }

  return next();
};

export default {
  emailOperationTracker,
  emailErrorHandler,
  emailHealthCheck,
  emailRateLimitWithMonitoring
};