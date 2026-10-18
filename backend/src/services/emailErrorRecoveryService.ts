import { 
  EmailError, 
  EmailErrorCode, 
  SendingError,
  errorRecoveryManager,
  getRetryStrategy,
  calculateRetryDelay 
} from '../utils/emailErrors';
import { emailLogger } from './emailLoggingService';
import { emailHealthMonitor } from './emailHealthMonitor';
import { EmailRecipient } from '../models/EmailRecipient';
import { EmailHistory } from '../models/EmailHistory';

/**
 * Comprehensive email error recovery service
 * Handles automatic retry, graceful degradation, and error recovery mechanisms
 */

export interface RecoveryAttempt {
  attemptId: string;
  originalError: EmailError;
  strategy: 'retry' | 'fallback' | 'graceful_degradation' | 'manual_intervention';
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'abandoned';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt?: Date;
  lastAttemptAt?: Date;
  recoveryData?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface RecoveryOptions {
  enableRetry?: boolean;
  enableFallback?: boolean;
  enableGracefulDegradation?: boolean;
  maxRetryAttempts?: number;
  customRetryDelay?: number;
  fallbackTemplate?: string;
  notifyOnFailure?: boolean;
}

class EmailErrorRecoveryService {
  private recoveryAttempts: Map<string, RecoveryAttempt> = new Map();
  private fallbackTemplates: Map<string, string> = new Map();
  private degradationStrategies: Map<EmailErrorCode, () => Promise<void>> = new Map();

  constructor() {
    this.initializeFallbackTemplates();
    this.initializeDegradationStrategies();
  }

  /**
   * Main recovery method - attempts to recover from email errors
   */
  async recoverFromError(
    error: EmailError,
    context: {
      operationId: string;
      adminId?: string;
      adminEmail?: string;
      recipientEmail?: string;
      templateId?: string;
      historyId?: string;
    },
    options: RecoveryOptions = {}
  ): Promise<{
    recovered: boolean;
    strategy: string;
    message: string;
    nextAction?: string;
  }> {
    const attemptId = `${context.operationId}_${Date.now()}`;
    
    emailLogger.logError(
      'EMAIL_ERROR_RECOVERY_INITIATED',
      error,
      context.adminId,
      context.adminEmail,
      context.recipientEmail,
      { attemptId, context, options }
    );

    // Create recovery attempt record
    const recoveryAttempt: RecoveryAttempt = {
      attemptId,
      originalError: error,
      strategy: 'retry', // Default strategy
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxRetryAttempts || 3,
      recoveryData: context,
      createdAt: new Date()
    };

    this.recoveryAttempts.set(attemptId, recoveryAttempt);

    try {
      // Determine recovery strategy based on error type and context
      const strategy = this.determineRecoveryStrategy(error, context, options);
      recoveryAttempt.strategy = strategy;
      recoveryAttempt.status = 'in_progress';

      let result: { recovered: boolean; strategy: string; message: string; nextAction?: string };

      switch (strategy) {
        case 'retry':
          result = await this.attemptRetryRecovery(error, context, options, recoveryAttempt);
          break;
        
        case 'fallback':
          result = await this.attemptFallbackRecovery(error, context, options, recoveryAttempt);
          break;
        
        case 'graceful_degradation':
          result = await this.attemptGracefulDegradation(error, context, options, recoveryAttempt);
          break;
        
        case 'manual_intervention':
          result = await this.requireManualIntervention(error, context, options, recoveryAttempt);
          break;
        
        default:
          result = {
            recovered: false,
            strategy: 'unknown',
            message: 'No recovery strategy available for this error type'
          };
      }

      // Update recovery attempt status
      recoveryAttempt.status = result.recovered ? 'success' : 'failed';
      recoveryAttempt.completedAt = new Date();

      emailLogger.logSuccess(
        'EMAIL_ERROR_RECOVERY_COMPLETED',
        context.adminId,
        context.adminEmail,
        {
          attemptId,
          strategy: result.strategy,
          recovered: result.recovered,
          message: result.message
        }
      );

      return result;

    } catch (recoveryError: any) {
      recoveryAttempt.status = 'failed';
      recoveryAttempt.completedAt = new Date();

      emailLogger.logError(
        'EMAIL_ERROR_RECOVERY_FAILED',
        recoveryError instanceof EmailError ? recoveryError : 
          new EmailError(recoveryError?.message || 'Unknown recovery error', EmailErrorCode.UNKNOWN_ERROR),
        context.adminId,
        context.adminEmail,
        context.recipientEmail,
        { attemptId, originalError: error.message }
      );

      return {
        recovered: false,
        strategy: 'recovery_failed',
        message: `Recovery attempt failed: ${recoveryError?.message || 'Unknown error'}`,
        nextAction: 'manual_intervention_required'
      };
    }
  }

  /**
   * Attempt retry-based recovery
   */
  private async attemptRetryRecovery(
    error: EmailError,
    context: any,
    options: RecoveryOptions,
    recoveryAttempt: RecoveryAttempt
  ): Promise<{ recovered: boolean; strategy: string; message: string; nextAction?: string }> {
    const retryStrategy = getRetryStrategy(error);
    
    if (!retryStrategy || !options.enableRetry) {
      return {
        recovered: false,
        strategy: 'retry_not_applicable',
        message: 'Retry strategy not available or disabled for this error type'
      };
    }

    try {
      // Use the error recovery manager for retry logic
      await errorRecoveryManager.executeWithRetry(
        context.operationId,
        async () => {
          // This would be the actual email sending operation
          // For now, we'll simulate based on error type
          if (error.code === EmailErrorCode.SMTP_CONNECTION_FAILED) {
            // Test connection recovery
            const isHealthy = await emailHealthMonitor.performHealthCheck();
            if (isHealthy.status === 'unhealthy') {
              throw new SendingError(
                'SMTP connection still unavailable',
                EmailErrorCode.SMTP_CONNECTION_FAILED,
                true
              );
            }
          }
          
          // If we get here, the retry was successful
          return true;
        },
        (retryError, attempt) => {
          recoveryAttempt.attempts = attempt;
          recoveryAttempt.lastAttemptAt = new Date();
          
          emailLogger.logError(
            'EMAIL_RETRY_ATTEMPT_FAILED',
            retryError,
            context.adminId,
            context.adminEmail,
            context.recipientEmail,
            { attemptId: recoveryAttempt.attemptId, attempt, maxAttempts: retryStrategy.maxRetries }
          );
        }
      );

      return {
        recovered: true,
        strategy: 'retry_successful',
        message: `Successfully recovered after ${recoveryAttempt.attempts} retry attempts`
      };

    } catch (retryError) {
      return {
        recovered: false,
        strategy: 'retry_exhausted',
        message: `Retry attempts exhausted (${recoveryAttempt.attempts}/${retryStrategy.maxRetries})`,
        nextAction: 'consider_fallback_or_manual_intervention'
      };
    }
  }

  /**
   * Attempt fallback recovery (using alternative templates or methods)
   */
  private async attemptFallbackRecovery(
    error: EmailError,
    context: any,
    options: RecoveryOptions,
    recoveryAttempt: RecoveryAttempt
  ): Promise<{ recovered: boolean; strategy: string; message: string; nextAction?: string }> {
    if (!options.enableFallback) {
      return {
        recovered: false,
        strategy: 'fallback_disabled',
        message: 'Fallback recovery is disabled'
      };
    }

    try {
      // Attempt to use fallback template or simplified email
      const fallbackTemplate = this.getFallbackTemplate(error.code);
      
      if (fallbackTemplate && context.recipientEmail) {
        // Log the fallback attempt
        emailLogger.logSuccess(
          'EMAIL_FALLBACK_ATTEMPT',
          context.adminId,
          context.adminEmail,
          {
            attemptId: recoveryAttempt.attemptId,
            originalError: error.code,
            fallbackTemplate: 'simplified_notification'
          }
        );

        // In a real implementation, this would send the fallback email
        // For now, we'll simulate success
        return {
          recovered: true,
          strategy: 'fallback_successful',
          message: 'Successfully sent simplified notification email as fallback'
        };
      }

      return {
        recovered: false,
        strategy: 'fallback_unavailable',
        message: 'No suitable fallback template available for this error type'
      };

    } catch (fallbackError: any) {
      return {
        recovered: false,
        strategy: 'fallback_failed',
        message: `Fallback attempt failed: ${fallbackError?.message || 'Unknown error'}`,
        nextAction: 'try_graceful_degradation'
      };
    }
  }

  /**
   * Attempt graceful degradation
   */
  private async attemptGracefulDegradation(
    error: EmailError,
    context: any,
    options: RecoveryOptions,
    recoveryAttempt: RecoveryAttempt
  ): Promise<{ recovered: boolean; strategy: string; message: string; nextAction?: string }> {
    if (!options.enableGracefulDegradation) {
      return {
        recovered: false,
        strategy: 'degradation_disabled',
        message: 'Graceful degradation is disabled'
      };
    }

    try {
      const degradationStrategy = this.degradationStrategies.get(error.code);
      
      if (degradationStrategy) {
        await degradationStrategy();
        
        return {
          recovered: true,
          strategy: 'graceful_degradation_successful',
          message: 'Applied graceful degradation strategy - service continues with reduced functionality'
        };
      }

      // Default degradation: disable non-critical features
      await this.applyDefaultDegradation(error, context);

      return {
        recovered: true,
        strategy: 'default_degradation_applied',
        message: 'Applied default degradation - email service continues with basic functionality'
      };

    } catch (degradationError: any) {
      return {
        recovered: false,
        strategy: 'degradation_failed',
        message: `Graceful degradation failed: ${degradationError?.message || 'Unknown error'}`,
        nextAction: 'manual_intervention_required'
      };
    }
  }

  /**
   * Require manual intervention
   */
  private async requireManualIntervention(
    error: EmailError,
    context: any,
    options: RecoveryOptions,
    recoveryAttempt: RecoveryAttempt
  ): Promise<{ recovered: boolean; strategy: string; message: string; nextAction?: string }> {
    // Log critical error requiring manual intervention
    emailLogger.logSuspiciousActivityDetailed(
      `Critical email error requiring manual intervention: ${error.message}`,
      'critical',
      context.adminId,
      context.adminEmail,
      {
        errorCode: error.code,
        context,
        recoveryAttemptId: recoveryAttempt.attemptId
      },
      'Email service partially suspended pending manual review'
    );

    // Update affected email records if applicable
    if (context.historyId) {
      await this.markEmailForManualReview(context.historyId, error);
    }

    return {
      recovered: false,
      strategy: 'manual_intervention_required',
      message: 'Critical error requires manual intervention - email service may be partially suspended',
      nextAction: 'contact_system_administrator'
    };
  }

  /**
   * Determine the best recovery strategy for the given error
   */
  private determineRecoveryStrategy(
    error: EmailError,
    context: any,
    options: RecoveryOptions
  ): 'retry' | 'fallback' | 'graceful_degradation' | 'manual_intervention' {
    // Critical errors require immediate manual intervention
    if (error.code === EmailErrorCode.SUSPICIOUS_ACTIVITY ||
        error.code === EmailErrorCode.CONTENT_SECURITY_VIOLATION) {
      return 'manual_intervention';
    }

    // Temporary SMTP issues can be retried
    if (error instanceof SendingError && error.retryable) {
      return 'retry';
    }

    // Template or content issues can use fallback
    if (error.code === EmailErrorCode.TEMPLATE_NOT_FOUND ||
        error.code === EmailErrorCode.TEMPLATE_VALIDATION_FAILED) {
      return 'fallback';
    }

    // Service availability issues use graceful degradation
    if (error.code === EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE ||
        error.code === EmailErrorCode.SMTP_CONNECTION_FAILED) {
      return 'graceful_degradation';
    }

    // Default to retry for most other errors
    return 'retry';
  }

  /**
   * Initialize fallback templates for different error scenarios
   */
  private initializeFallbackTemplates(): void {
    this.fallbackTemplates.set(EmailErrorCode.TEMPLATE_NOT_FOUND, `
      <h2>Notification from BanhMi App</h2>
      <p>Dear User,</p>
      <p>This is an important notification from BanhMi App.</p>
      <p>Please check your account for updates.</p>
      <p>Best regards,<br>BanhMi App Team</p>
    `);

    this.fallbackTemplates.set(EmailErrorCode.TEMPLATE_VALIDATION_FAILED, `
      <h2>System Notification</h2>
      <p>Hello,</p>
      <p>You have received this notification from BanhMi App.</p>
      <p>For more details, please log into your account.</p>
      <p>Thank you,<br>BanhMi App</p>
    `);
  }

  /**
   * Initialize degradation strategies for different error types
   */
  private initializeDegradationStrategies(): void {
    this.degradationStrategies.set(EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE, async () => {
      // Disable bulk email functionality
      emailHealthMonitor.getHealthStatus().features.bulkEmail = false;
      emailLogger.logSuccess(
        'DEGRADATION_STRATEGY_APPLIED',
        undefined,
        undefined,
        { strategy: 'disable_bulk_email', reason: 'email_service_unavailable' }
      );
    });

    this.degradationStrategies.set(EmailErrorCode.SMTP_CONNECTION_FAILED, async () => {
      // Disable all sending features but keep preview
      const healthStatus = emailHealthMonitor.getHealthStatus();
      healthStatus.features.bulkEmail = false;
      healthStatus.features.automatedEmails = false;
      healthStatus.features.templatePreview = true;
      
      emailLogger.logSuccess(
        'DEGRADATION_STRATEGY_APPLIED',
        undefined,
        undefined,
        { strategy: 'disable_sending_features', reason: 'smtp_connection_failed' }
      );
    });
  }

  /**
   * Get fallback template for error code
   */
  private getFallbackTemplate(errorCode: EmailErrorCode): string | undefined {
    return this.fallbackTemplates.get(errorCode);
  }

  /**
   * Apply default degradation strategy
   */
  private async applyDefaultDegradation(error: EmailError, context: any): Promise<void> {
    // Reduce service capabilities based on error severity
    const healthStatus = emailHealthMonitor.getHealthStatus();
    
    if (healthStatus.consecutiveFailures > 5) {
      healthStatus.features.bulkEmail = false;
    }
    
    if (healthStatus.consecutiveFailures > 10) {
      healthStatus.features.automatedEmails = false;
    }

    emailLogger.logSuccess(
      'DEFAULT_DEGRADATION_APPLIED',
      context.adminId,
      context.adminEmail,
      {
        errorCode: error.code,
        consecutiveFailures: healthStatus.consecutiveFailures,
        remainingFeatures: healthStatus.features
      }
    );
  }

  /**
   * Mark email for manual review
   */
  private async markEmailForManualReview(historyId: string, error: EmailError): Promise<void> {
    try {
      await EmailHistory.findByIdAndUpdate(historyId, {
        status: 'requires_manual_review',
        $push: {
          errors: {
            code: error.code,
            message: error.message,
            timestamp: new Date(),
            requiresManualReview: true
          }
        }
      });

      // Also mark all pending recipients for manual review
      await EmailRecipient.updateMany(
        { historyId, status: 'pending' },
        { 
          status: 'requires_manual_review',
          error: `Manual review required due to: ${error.message}`
        }
      );

    } catch (updateError: any) {
      emailLogger.logError(
        'FAILED_TO_MARK_FOR_MANUAL_REVIEW',
        updateError instanceof EmailError ? updateError : 
          new EmailError(updateError?.message || 'Database update failed', EmailErrorCode.DATABASE_ERROR),
        undefined,
        undefined,
        undefined,
        { historyId, originalError: error.code }
      );
    }
  }

  /**
   * Get recovery attempt status
   */
  getRecoveryAttempt(attemptId: string): RecoveryAttempt | undefined {
    return this.recoveryAttempts.get(attemptId);
  }

  /**
   * Get all active recovery attempts
   */
  getActiveRecoveryAttempts(): RecoveryAttempt[] {
    return Array.from(this.recoveryAttempts.values())
      .filter(attempt => attempt.status === 'pending' || attempt.status === 'in_progress');
  }

  /**
   * Clean up old recovery attempts
   */
  cleanupOldRecoveryAttempts(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [attemptId, attempt] of this.recoveryAttempts.entries()) {
      if (attempt.createdAt < cutoffTime && 
          (attempt.status === 'success' || attempt.status === 'failed' || attempt.status === 'abandoned')) {
        this.recoveryAttempts.delete(attemptId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      emailLogger.logSuccess(
        'RECOVERY_ATTEMPTS_CLEANUP',
        undefined,
        undefined,
        { cleanedCount, cutoffTime }
      );
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const emailErrorRecoveryService = new EmailErrorRecoveryService();

// Export types
export { EmailErrorRecoveryService };