import { emailLogger } from './emailLoggingService';
import { EmailError, EmailErrorCode, SendingError } from '../utils/emailErrors';
import { createEmailTransporter } from '../config/email';
// import { sendSingleEmail } from './emailService'; // Not needed for health check

/**
 * Email service health monitoring and graceful degradation
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  consecutiveFailures: number;
  lastError?: string;
  responseTime?: number;
  smtpConnected: boolean;
  queueSize: number;
  features: {
    bulkEmail: boolean;
    templatePreview: boolean;
    automatedEmails: boolean;
  };
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

class EmailHealthMonitor {
  private healthStatus: HealthStatus = {
    status: 'healthy',
    lastCheck: new Date(),
    consecutiveFailures: 0,
    smtpConnected: true,
    queueSize: 0,
    features: {
      bulkEmail: true,
      templatePreview: true,
      automatedEmails: true
    }
  };

  private circuitBreaker: CircuitBreakerState = {
    state: 'closed',
    failureCount: 0
  };

  private readonly maxFailures = 5;
  private readonly timeoutDuration = 5 * 60 * 1000; // 5 minutes
  private readonly healthCheckInterval = 2 * 60 * 1000; // 2 minutes
  private healthCheckTimer?: NodeJS.Timeout;

  constructor() {
    // this.startHealthChecks();
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  /**
   * Check if email service is available
   */
  isServiceAvailable(): boolean {
    return this.circuitBreaker.state !== 'open' && 
           this.healthStatus.status !== 'unhealthy';
  }

  /**
   * Check if specific feature is available
   */
  isFeatureAvailable(feature: keyof HealthStatus['features']): boolean {
    return this.isServiceAvailable() && this.healthStatus.features[feature];
  }

  /**
   * Record successful operation
   */
  recordSuccess(): void {
    this.healthStatus.consecutiveFailures = 0;
    
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.state = 'closed';
      this.circuitBreaker.failureCount = 0;
      emailLogger.logSuccess('CIRCUIT_BREAKER_CLOSED', undefined, undefined, {
        reason: 'Successful operation after half-open state'
      });
    }

    this.updateHealthStatus();
  }

  /**
   * Record failed operation
   */
  recordFailure(error: EmailError | Error): void {
    this.healthStatus.consecutiveFailures++;
    this.healthStatus.lastError = error.message;
    
    // Update circuit breaker
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = new Date();

    if (this.circuitBreaker.failureCount >= this.maxFailures) {
      this.openCircuitBreaker();
    }

    this.updateHealthStatus();
    this.adjustFeatureAvailability(error);

    emailLogger.logError(
      'EMAIL_SERVICE_FAILURE',
      error instanceof EmailError ? error : new EmailError(error.message, EmailErrorCode.UNKNOWN_ERROR),
      undefined,
      undefined,
      undefined,
      {
        consecutiveFailures: this.healthStatus.consecutiveFailures,
        circuitBreakerState: this.circuitBreaker.state
      }
    );
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    console.log({startTime});
    
    try {
      // Test SMTP connection by sending a test email to a non-existent address
      // This will test the connection without actually sending an email
      await this.testSmtpConnection();
      
      const responseTime = Date.now() - startTime;
      this.healthStatus.responseTime = responseTime;
      this.healthStatus.smtpConnected = true;
      this.healthStatus.lastCheck = new Date();
      
      this.recordSuccess();
      
      emailLogger.logHealthCheck('healthy', {
        responseTime,
        consecutiveFailures: this.healthStatus.consecutiveFailures
      });
      
    } catch (error) {
      this.healthStatus.smtpConnected = false;
      this.healthStatus.lastCheck = new Date();
      
      this.recordFailure(error as Error);
      
      emailLogger.logHealthCheck('unhealthy', {
        error: (error as Error).message,
        consecutiveFailures: this.healthStatus.consecutiveFailures
      });
    }

    return this.getHealthStatus();
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Check circuit breaker state
    if (this.circuitBreaker.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.circuitBreaker.state = 'half-open';
        emailLogger.logSuccess('CIRCUIT_BREAKER_HALF_OPEN', undefined, undefined, {
          operationName
        });
      } else {
        throw new SendingError(
          'Email service is temporarily unavailable',
          EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE,
          true,
          this.getTimeUntilNextAttempt()
        );
      }
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }

  /**
   * Get graceful degradation options
   */
  getDegradationOptions(): {
    canSendEmail: boolean;
    canPreviewTemplate: boolean;
    canSendBulkEmail: boolean;
    canSendAutomatedEmail: boolean;
    recommendedAction: string;
  } {
    const status = this.healthStatus.status;
    const features = this.healthStatus.features;

    switch (status) {
      case 'healthy':
        return {
          canSendEmail: true,
          canPreviewTemplate: true,
          canSendBulkEmail: features.bulkEmail,
          canSendAutomatedEmail: features.automatedEmails,
          recommendedAction: 'All email features are available'
        };

      case 'degraded':
        return {
          canSendEmail: true,
          canPreviewTemplate: features.templatePreview,
          canSendBulkEmail: false, // Disable bulk email in degraded mode
          canSendAutomatedEmail: features.automatedEmails,
          recommendedAction: 'Bulk email is temporarily disabled. Individual emails are still available.'
        };

      case 'unhealthy':
        return {
          canSendEmail: false,
          canPreviewTemplate: features.templatePreview, // Preview doesn't require SMTP
          canSendBulkEmail: false,
          canSendAutomatedEmail: false,
          recommendedAction: 'Email service is unavailable. Please try again later.'
        };

      default:
        return {
          canSendEmail: false,
          canPreviewTemplate: false,
          canSendBulkEmail: false,
          canSendAutomatedEmail: false,
          recommendedAction: 'Email service status unknown. Please contact support.'
        };
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('Health check failed:', error);
      });
    }, this.healthCheckInterval);

    // Perform initial health check
    setTimeout(() => {
      this.performHealthCheck().catch(error => {
        console.error('Initial health check failed:', error);
      });
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Test SMTP connection
   */
  private async testSmtpConnection(): Promise<void> {
    // Create a minimal test that verifies SMTP connection without sending email
    const transporter = createEmailTransporter();

    // Verify connection
    await transporter.verify();
  }

  /**
   * Open circuit breaker
   */
  private openCircuitBreaker(): void {
    this.circuitBreaker.state = 'open';
    this.circuitBreaker.nextAttemptTime = new Date(Date.now() + this.timeoutDuration);
    
    emailLogger.logError(
      'CIRCUIT_BREAKER_OPENED',
      new EmailError('Circuit breaker opened due to consecutive failures', EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE),
      undefined,
      undefined,
      undefined,
      {
        failureCount: this.circuitBreaker.failureCount,
        nextAttemptTime: this.circuitBreaker.nextAttemptTime
      }
    );
  }

  /**
   * Check if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return this.circuitBreaker.nextAttemptTime ? 
      Date.now() >= this.circuitBreaker.nextAttemptTime.getTime() : false;
  }

  /**
   * Get time until next attempt (in seconds)
   */
  private getTimeUntilNextAttempt(): number {
    if (!this.circuitBreaker.nextAttemptTime) return 0;
    return Math.max(0, Math.ceil((this.circuitBreaker.nextAttemptTime.getTime() - Date.now()) / 1000));
  }

  /**
   * Update overall health status
   */
  private updateHealthStatus(): void {
    const failures = this.healthStatus.consecutiveFailures;
    
    if (failures === 0) {
      this.healthStatus.status = 'healthy';
    } else if (failures < 3) {
      this.healthStatus.status = 'degraded';
    } else {
      this.healthStatus.status = 'unhealthy';
    }
  }

  /**
   * Adjust feature availability based on error type
   */
  private adjustFeatureAvailability(error: Error): void {
    if (error instanceof EmailError) {
      switch (error.code) {
        case EmailErrorCode.SMTP_CONNECTION_FAILED:
        case EmailErrorCode.SMTP_AUTHENTICATION_FAILED:
          // Disable all sending features but keep preview
          this.healthStatus.features.bulkEmail = false;
          this.healthStatus.features.automatedEmails = false;
          this.healthStatus.features.templatePreview = true;
          break;

        case EmailErrorCode.RATE_LIMIT_EXCEEDED:
          // Temporarily disable bulk email
          this.healthStatus.features.bulkEmail = false;
          break;

        case EmailErrorCode.EMAIL_QUEUE_FULL:
          // Disable bulk email and automated emails
          this.healthStatus.features.bulkEmail = false;
          this.healthStatus.features.automatedEmails = false;
          break;

        default:
          // For other errors, gradually disable features based on failure count
          if (this.healthStatus.consecutiveFailures >= 3) {
            this.healthStatus.features.bulkEmail = false;
          }
          if (this.healthStatus.consecutiveFailures >= 5) {
            this.healthStatus.features.automatedEmails = false;
          }
      }
    }
  }
}

// Export singleton instance
export const emailHealthMonitor = new EmailHealthMonitor();

// Export types
export { EmailHealthMonitor };