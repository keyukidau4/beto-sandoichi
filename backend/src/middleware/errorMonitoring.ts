import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Error monitoring and reporting
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorCounts: Map<string, number> = new Map();
  private lastReset: Date = new Date();

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  // Track error occurrence
  trackError(error: Error, context?: any) {
    const errorKey = `${error.name}:${error.message}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Log error with context
    logger.error('Application Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      count: currentCount + 1,
      timestamp: new Date().toISOString(),
    });

    // Alert if error occurs frequently
    if (currentCount + 1 >= 10) {
      this.sendAlert(error, currentCount + 1);
    }
  }

  // Send alert for frequent errors
  private sendAlert(error: Error, count: number) {
    logger.error('HIGH FREQUENCY ERROR ALERT', {
      error: error.message,
      count,
      timeWindow: '1 hour',
      action: 'immediate_attention_required',
    });

    // In production, you would integrate with alerting services like:
    // - Slack webhooks
    // - PagerDuty
    // - Email notifications
    // - SMS alerts
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      uniqueErrors: this.errorCounts.size,
      topErrors: Array.from(this.errorCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      lastReset: this.lastReset,
    };
  }

  // Reset error counts (called hourly)
  resetCounts() {
    this.errorCounts.clear();
    this.lastReset = new Date();
    logger.info('Error monitoring counts reset');
  }
}

// Global error handler middleware
export const errorMonitoringMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const monitor = ErrorMonitor.getInstance();
  
  // Track the error
  monitor.trackError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      errorId: Date.now().toString(), // For tracking
    });
  } else {
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
};

// Performance monitoring middleware
// export const performanceMonitoringMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const startTime = Date.now();

//   // Override res.end to capture response time
//   const originalEnd = res.end;
//   res.end = function(...args: any[]) {
//     const responseTime = Date.now() - startTime;
    
//     // Log slow requests
//     if (responseTime > 1000) {
//       logger.warn('Slow Request Detected', {
//         method: req.method,
//         url: req.url,
//         responseTime: `${responseTime}ms`,
//         statusCode: res.statusCode,
//         userId: (req as any).user?.id,
//       });
//     }

//     // Log very slow requests as errors
//     if (responseTime > 5000) {
//       logger.error('Very Slow Request', {
//         method: req.method,
//         url: req.url,
//         responseTime: `${responseTime}ms`,
//         statusCode: res.statusCode,
//         userId: (req as any).user?.id,
//         action: 'performance_investigation_required',
//       });
//     }

//     originalEnd.apply(this, args);
//   };

//   next();
// };

// Health check endpoint for monitoring
export const healthCheckHandler = (req: Request, res: Response) => {
  const monitor = ErrorMonitor.getInstance();
  const stats = monitor.getErrorStats();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    errors: stats,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  };

  // Mark as unhealthy if too many errors
  if (stats.totalErrors > 100) {
    health.status = 'unhealthy';
    res.status(503);
  }

  res.json(health);
};