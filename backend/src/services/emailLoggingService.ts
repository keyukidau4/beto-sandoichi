import { EmailError, EmailErrorCode } from "../utils/emailErrors";

/**
 * Email logging service for comprehensive error tracking and monitoring
 */

export interface EmailLogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  action: string;
  adminId?: string;
  adminEmail?: string;
  templateId?: string;
  recipientEmail?: string;
  recipientCount?: number;
  errorCode?: EmailErrorCode;
  errorMessage?: string;
  context?: Record<string, any>;
  duration?: number;
  success: boolean;
}

export interface EmailMetrics {
  totalEmailsSent: number;
  totalEmailsFailed: number;
  successRate: number;
  averageProcessingTime: number;
  errorsByCode: Record<EmailErrorCode, number>;
  recentErrors: EmailLogEntry[];
}

class EmailLoggingService {
  private logs: EmailLogEntry[] = [];
  private maxLogEntries = 10000; // Keep last 10k entries in memory
  private metrics: EmailMetrics = {
    totalEmailsSent: 0,
    totalEmailsFailed: 0,
    successRate: 0,
    averageProcessingTime: 0,
    errorsByCode: {} as Record<EmailErrorCode, number>,
    recentErrors: [],
  };

  /**
   * Log email operation
   */
  log(entry: Omit<EmailLogEntry, "timestamp">): void {
    const logEntry: EmailLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Add to logs
    this.logs.push(logEntry);

    // Maintain log size limit
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Update metrics
    this.updateMetrics(logEntry);

    // Console logging with appropriate level
    this.consoleLog(logEntry);

    // In production, you would also send to external logging service
    // this.sendToExternalLogger(logEntry);
  }

  /**
   * Log successful email operation
   */
  logSuccess(
    action: string,
    adminId?: string,
    adminEmail?: string,
    context?: Record<string, any>,
    duration?: number
  ): void {
    this.log({
      level: "info",
      action,
      adminId,
      adminEmail,
      context,
      duration,
      success: true,
    });
  }

  /**
   * Log email error
   */
  logError(
    action: string,
    error: EmailError | Error,
    adminId?: string,
    adminEmail?: string,
    recipientEmail?: string,
    context?: Record<string, any>
  ): void {
    const emailError = error instanceof EmailError ? error : null;

    this.log({
      level: "error",
      action,
      adminId,
      adminEmail,
      recipientEmail,
      errorCode: emailError?.code,
      errorMessage: error.message,
      context: {
        ...context,
        ...(emailError?.context || {}),
        stack: error.stack,
      },
      success: false,
    });
  }

  /**
   * Log bulk email operation
   */
  logBulkEmail(
    action: string,
    adminId: string,
    adminEmail: string,
    templateId: string,
    recipientCount: number,
    successCount: number,
    failureCount: number,
    duration: number,
    errors?: EmailError[]
  ): void {
    // Log overall bulk operation
    this.log({
      level: successCount > 0 ? "info" : "error",
      action,
      adminId,
      adminEmail,
      templateId,
      recipientCount,
      context: {
        successCount,
        failureCount,
        successRate: (successCount / recipientCount) * 100,
      },
      duration,
      success: successCount > 0,
    });

    // Log individual errors
    if (errors && errors.length > 0) {
      errors.forEach((error) => {
        this.logError(
          `${action}_individual_failure`,
          error,
          adminId,
          adminEmail,
          undefined,
          { templateId, bulkOperation: true }
        );
      });
    }
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    activity: string,
    adminId?: string,
    adminEmail?: string,
    context?: Record<string, any>
  ): void {
    this.log({
      level: "warn",
      action: `SUSPICIOUS_ACTIVITY: ${activity}`,
      adminId,
      adminEmail,
      context: {
        ...context,
        securityAlert: true,
        timestamp: new Date().toISOString(),
      },
      success: false,
    });

    // In production, this would trigger security alerts
    console.warn(`🚨 SECURITY ALERT: ${activity}`, {
      adminId,
      adminEmail,
      context,
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(
    endpoint: string,
    adminId?: string,
    adminEmail?: string,
    context?: Record<string, any>
  ): void {
    this.log({
      level: "warn",
      action: `RATE_LIMIT_EXCEEDED: ${endpoint}`,
      adminId,
      adminEmail,
      errorCode: EmailErrorCode.RATE_LIMIT_EXCEEDED,
      context,
      success: false,
    });
  }

  /**
   * Log email service health check
   */
  logHealthCheck(
    status: "healthy" | "degraded" | "unhealthy",
    context?: Record<string, any>
  ): void {
    this.log({
      level:
        status === "healthy"
          ? "info"
          : status === "degraded"
          ? "warn"
          : "error",
      action: `EMAIL_SERVICE_HEALTH_CHECK`,
      context: {
        status,
        ...context,
      },
      success: status !== "unhealthy",
    });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(
    limit: number = 100,
    level?: EmailLogEntry["level"]
  ): EmailLogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter((log) => log.level === level);
    }

    return filteredLogs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get error logs for specific time period
   */
  getErrorLogs(
    startTime: Date,
    endTime: Date = new Date(),
    errorCode?: EmailErrorCode
  ): EmailLogEntry[] {
    return this.logs.filter((log) => {
      const matchesTimeRange =
        log.timestamp >= startTime && log.timestamp <= endTime;
      const matchesLevel = log.level === "error";
      const matchesErrorCode = !errorCode || log.errorCode === errorCode;

      return matchesTimeRange && matchesLevel && matchesErrorCode;
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): EmailMetrics {
    return { ...this.metrics };
  }

  /**
   * Get admin activity summary
   */
  getAdminActivity(
    adminId: string,
    hours: number = 24
  ): {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    recentActions: EmailLogEntry[];
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const adminLogs = this.logs.filter(
      (log) => log.adminId === adminId && log.timestamp >= cutoffTime
    );

    return {
      totalActions: adminLogs.length,
      successfulActions: adminLogs.filter((log) => log.success).length,
      failedActions: adminLogs.filter((log) => !log.success).length,
      recentActions: adminLogs.slice(-20),
    };
  }

  /**
   * Check for anomalous patterns with enhanced detection
   */
  detectAnomalies(adminId?: string): {
    rapidRequests: boolean;
    highFailureRate: boolean;
    suspiciousPatterns: string[];
    riskLevel: "low" | "medium" | "high" | "critical";
    recommendations: string[];
  } {
    const recentLogs = adminId
      ? this.logs.filter((log) => log.adminId === adminId).slice(-100)
      : this.logs.slice(-200);

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentRequests = recentLogs.filter(
      (log) => log.timestamp.getTime() > fiveMinutesAgo
    );
    const mediumTermRequests = recentLogs.filter(
      (log) => log.timestamp.getTime() > fifteenMinutesAgo
    );
    const hourlyRequests = recentLogs.filter(
      (log) => log.timestamp.getTime() > oneHourAgo
    );

    // Check for rapid requests (more than 20 in 5 minutes)
    const rapidRequests = recentRequests.length > 20;

    // Check for high failure rate (more than 50% failures in recent requests)
    const failures = recentRequests.filter((log) => !log.success).length;
    const highFailureRate =
      recentRequests.length > 5 && failures / recentRequests.length > 0.5;

    // Enhanced suspicious pattern detection
    const suspiciousPatterns: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // 1. Multiple failed authentication attempts
    const authFailures = recentLogs.filter(
      (log) => log.errorCode === EmailErrorCode.UNAUTHORIZED_ACCESS
    ).length;
    if (authFailures > 3) {
      suspiciousPatterns.push(
        `Multiple authentication failures (${authFailures})`
      );
      recommendations.push(
        "Review admin access credentials and consider password reset"
      );
      riskScore += 2;
    }

    // 2. Excessive bulk email usage
    const bulkEmails = mediumTermRequests.filter(
      (log) =>
        log.action.includes("bulk") &&
        log.recipientCount &&
        log.recipientCount >= 8
    ).length;
    if (bulkEmails > 5) {
      suspiciousPatterns.push(
        `Excessive bulk email usage (${bulkEmails} operations in 15 minutes)`
      );
      recommendations.push(
        "Monitor for potential spam activity and verify legitimate business use"
      );
      riskScore += 3;
    }

    // 3. Unusual time patterns (activity outside business hours)
    const currentHour = new Date().getHours();
    const offHoursActivity = recentRequests.filter((log) => {
      const hour = log.timestamp.getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    }).length;
    if (offHoursActivity > 5) {
      suspiciousPatterns.push(
        `High activity outside business hours (${offHoursActivity} requests)`
      );
      recommendations.push("Verify if off-hours activity is authorized");
      riskScore += 1;
    }

    // 4. Repeated template modifications
    const templateModifications = mediumTermRequests.filter(
      (log) =>
        log.action.includes("template") &&
        (log.action.includes("create") || log.action.includes("update"))
    ).length;
    if (templateModifications > 10) {
      suspiciousPatterns.push(
        `Excessive template modifications (${templateModifications})`
      );
      recommendations.push(
        "Review template changes for potential malicious content"
      );
      riskScore += 2;
    }

    // 5. High error rate with specific error codes
    const smtpErrors = recentLogs.filter(
      (log) =>
        log.errorCode === EmailErrorCode.SMTP_CONNECTION_FAILED ||
        log.errorCode === EmailErrorCode.SMTP_AUTHENTICATION_FAILED
    ).length;
    if (smtpErrors > 10) {
      suspiciousPatterns.push(`High SMTP error rate (${smtpErrors})`);
      recommendations.push("Check email service configuration and credentials");
      riskScore += 2;
    }

    // 6. Unusual recipient patterns
    const uniqueRecipients = new Set();
    const recipientLogs = mediumTermRequests.filter(
      (log) => log.recipientEmail
    );
    recipientLogs.forEach((log) => {
      if (log.recipientEmail) uniqueRecipients.add(log.recipientEmail);
    });

    if (uniqueRecipients.size > 50) {
      suspiciousPatterns.push(
        `High number of unique recipients (${uniqueRecipients.size})`
      );
      recommendations.push(
        "Verify recipient list legitimacy and check for potential data harvesting"
      );
      riskScore += 3;
    }

    // 7. Rapid template switching
    const templateIds = new Set();
    mediumTermRequests.forEach((log) => {
      if (log.templateId) templateIds.add(log.templateId);
    });
    if (templateIds.size > 10) {
      suspiciousPatterns.push(
        `Rapid template switching (${templateIds.size} different templates)`
      );
      recommendations.push(
        "Review template usage patterns for potential abuse"
      );
      riskScore += 1;
    }

    // 8. Consistent failure patterns
    const consistentFailures = recentLogs.filter((log) => !log.success).length;
    if (
      consistentFailures > 20 &&
      consistentFailures / recentLogs.length > 0.8
    ) {
      suspiciousPatterns.push(
        `Consistent failure pattern (${Math.round(
          (consistentFailures / recentLogs.length) * 100
        )}% failure rate)`
      );
      recommendations.push(
        "Investigate potential system compromise or configuration issues"
      );
      riskScore += 4;
    }

    // 9. Rate limit violations
    const rateLimitViolations = hourlyRequests.filter(
      (log) => log.errorCode === EmailErrorCode.RATE_LIMIT_EXCEEDED
    ).length;
    if (rateLimitViolations > 5) {
      suspiciousPatterns.push(
        `Multiple rate limit violations (${rateLimitViolations})`
      );
      recommendations.push(
        "Review usage patterns and consider adjusting rate limits or investigating abuse"
      );
      riskScore += 2;
    }

    // 10. Security violations
    const securityViolations = recentLogs.filter(
      (log) =>
        log.errorCode === EmailErrorCode.CONTENT_SECURITY_VIOLATION ||
        log.errorCode === EmailErrorCode.SUSPICIOUS_ACTIVITY
    ).length;
    if (securityViolations > 0) {
      suspiciousPatterns.push(
        `Security violations detected (${securityViolations})`
      );
      recommendations.push(
        "Immediate security review required - potential malicious activity"
      );
      riskScore += 5;
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (riskScore >= 8) {
      riskLevel = "critical";
      recommendations.unshift(
        "IMMEDIATE ACTION REQUIRED: Suspend email functionality and conduct security audit"
      );
    } else if (riskScore >= 5) {
      riskLevel = "high";
      recommendations.unshift(
        "High risk detected: Enhanced monitoring and immediate review recommended"
      );
    } else if (riskScore >= 3) {
      riskLevel = "medium";
      recommendations.unshift("Medium risk: Increased monitoring recommended");
    } else {
      riskLevel = "low";
    }

    // Add general recommendations if no specific ones
    if (recommendations.length === 0) {
      recommendations.push("Continue normal monitoring");
    }

    return {
      rapidRequests,
      highFailureRate,
      suspiciousPatterns,
      riskLevel,
      recommendations,
    };
  }

  /**
   * Enhanced suspicious activity logging with detailed context
   */
  logSuspiciousActivityDetailed(
    activity: string,
    severity: "low" | "medium" | "high" | "critical",
    adminId?: string,
    adminEmail?: string,
    context?: Record<string, any>,
    automaticResponse?: string
  ): void {
    const logEntry = {
      level: severity === "critical" ? ("error" as const) : ("warn" as const),
      action: `SUSPICIOUS_ACTIVITY_${severity.toUpperCase()}: ${activity}`,
      adminId,
      adminEmail,
      context: {
        ...context,
        severity,
        securityAlert: true,
        timestamp: new Date().toISOString(),
        automaticResponse,
        requiresInvestigation: severity === "high" || severity === "critical",
      },
      success: false,
    };

    this.log(logEntry);

    // Enhanced console logging with severity-based formatting
    const severityEmoji = {
      low: "⚠️",
      medium: "🚨",
      high: "🔥",
      critical: "💀",
    };

    console.warn(
      `${
        severityEmoji[severity]
      } SECURITY ALERT [${severity.toUpperCase()}]: ${activity}`,
      {
        adminId,
        adminEmail,
        context,
        automaticResponse,
        timestamp: new Date().toISOString(),
      }
    );

    // In production, trigger appropriate alerts based on severity
    if (severity === "critical") {
      // Immediate notification to security team
      this.triggerCriticalAlert(activity, adminId, adminEmail, context);
    } else if (severity === "high") {
      // Urgent notification
      this.triggerHighPriorityAlert(activity, adminId, adminEmail, context);
    }
  }

  /**
   * Trigger critical security alert (placeholder for production implementation)
   */
  private triggerCriticalAlert(
    activity: string,
    adminId?: string,
    adminEmail?: string,
    context?: Record<string, any>
  ): void {
    // In production, this would:
    // 1. Send immediate notifications to security team
    // 2. Create incident tickets
    // 3. Potentially trigger automatic security responses
    // 4. Log to security information and event management (SIEM) systems

    console.error(
      "🚨 CRITICAL SECURITY ALERT - IMMEDIATE ATTENTION REQUIRED 🚨",
      {
        activity,
        adminId,
        adminEmail,
        context,
        timestamp: new Date().toISOString(),
        action: "security_team_notified",
      }
    );
  }

  /**
   * Trigger high priority alert (placeholder for production implementation)
   */
  private triggerHighPriorityAlert(
    activity: string,
    adminId?: string,
    adminEmail?: string,
    context?: Record<string, any>
  ): void {
    // In production, this would:
    // 1. Send notifications to admin team
    // 2. Create monitoring tickets
    // 3. Increase monitoring frequency

    console.warn("🔥 HIGH PRIORITY SECURITY ALERT", {
      activity,
      adminId,
      adminEmail,
      context,
      timestamp: new Date().toISOString(),
      action: "admin_team_notified",
    });
  }

  /**
   * Update internal metrics
   */
  private updateMetrics(entry: EmailLogEntry): void {
    if (entry.action.includes("send") || entry.action.includes("bulk")) {
      if (entry.success) {
        this.metrics.totalEmailsSent += entry.recipientCount || 1;
      } else {
        this.metrics.totalEmailsFailed += entry.recipientCount || 1;
      }

      // Update success rate
      const total =
        this.metrics.totalEmailsSent + this.metrics.totalEmailsFailed;
      this.metrics.successRate =
        total > 0 ? (this.metrics.totalEmailsSent / total) * 100 : 0;
    }

    // Update error counts
    if (entry.errorCode) {
      this.metrics.errorsByCode[entry.errorCode] =
        (this.metrics.errorsByCode[entry.errorCode] || 0) + 1;
    }

    // Update recent errors
    if (entry.level === "error") {
      this.metrics.recentErrors.unshift(entry);
      this.metrics.recentErrors = this.metrics.recentErrors.slice(0, 50);
    }

    // Update average processing time
    if (entry.duration) {
      const durationsWithTime = this.logs
        .filter((log) => log.duration)
        .map((log) => log.duration!);

      if (durationsWithTime.length > 0) {
        this.metrics.averageProcessingTime =
          durationsWithTime.reduce((sum, duration) => sum + duration, 0) /
          durationsWithTime.length;
      }
    }
  }

  /**
   * Console logging with formatting
   */
  private consoleLog(entry: EmailLogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const action = entry.action;
    const admin = entry.adminEmail ? `[${entry.adminEmail}]` : "";
    const success = entry.success ? "✅" : "❌";

    let message = `${timestamp} [${level}] ${success} ${action} ${admin}`;

    if (entry.errorMessage) {
      message += ` - Error: ${entry.errorMessage}`;
    }

    if (entry.duration) {
      message += ` - Duration: ${entry.duration}ms`;
    }

    switch (entry.level) {
      case "error":
        console.error(message, entry.context);
        break;
      case "warn":
        console.warn(message, entry.context);
        break;
      case "debug":
        console.debug(message, entry.context);
        break;
      default:
        console.log(message, entry.context);
    }
  }

  /**
   * Clear old logs (for maintenance)
   */
  clearOldLogs(olderThanDays: number = 30): number {
    const cutoffTime = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    );
    const initialCount = this.logs.length;

    this.logs = this.logs.filter((log) => log.timestamp >= cutoffTime);

    return initialCount - this.logs.length;
  }
}

// Export singleton instance
export const emailLogger = new EmailLoggingService();

// Export types and utilities
export { EmailLoggingService };
