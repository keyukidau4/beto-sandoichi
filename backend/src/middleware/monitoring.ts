import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

/**
 * Interface for request metrics
 */
interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

/**
 * Enhanced request logging middleware with performance monitoring
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();
  
  // Get request size
  const requestSize = req.get('content-length') ? parseInt(req.get('content-length')!, 10) : 0;
  
  // Store original res.json to capture response size
  const originalJson = res.json;
  let responseSize = 0;
  
  res.json = function(body: any) {
    responseSize = JSON.stringify(body).length;
    return originalJson.call(this, body);
  };
  
  // Log when response finishes
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    const metrics: RequestMetrics = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: getClientIP(req),
      userId: (req as any).user?.id,
      userRole: (req as any).user?.role,
      timestamp,
      requestSize,
      responseSize,
    };
    
    // Log based on status code and response time
    if (res.statusCode >= 500) {
      console.error('🔴 SERVER ERROR:', formatLogMessage(metrics));
    } else if (res.statusCode >= 400) {
      console.warn('🟡 CLIENT ERROR:', formatLogMessage(metrics));
    } else if (responseTime > 1000) {
      console.warn('🐌 SLOW REQUEST:', formatLogMessage(metrics));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('📝 REQUEST:', formatLogMessage(metrics));
    }
    
    // Log security-related events
    logSecurityEvents(req, res, metrics);
    
    // Log performance metrics for monitoring
    logPerformanceMetrics(metrics);
  });
  
  next();
};

/**
 * Security event logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log authentication attempts
  if (req.path.includes('/auth/login')) {
    console.log(`🔐 LOGIN ATTEMPT: IP=${getClientIP(req)}, Email=${req.body?.email}, Time=${new Date().toISOString()}`);
  }
  
  // Log failed authentication
  res.on('finish', () => {
    if (req.path.includes('/auth/login') && res.statusCode === 401) {
      console.warn(`🚫 FAILED LOGIN: IP=${getClientIP(req)}, Email=${req.body?.email}, Time=${new Date().toISOString()}`);
    }
    
    // Log admin operations
    if (req.path.includes('/admin') && res.statusCode < 400) {
      console.log(`👑 ADMIN ACTION: User=${(req as any).user?.email}, Action=${req.method} ${req.path}, Time=${new Date().toISOString()}`);
    }
    
    // Log suspicious activities
    if (res.statusCode === 403 || res.statusCode === 429) {
      console.warn(`⚠️ SUSPICIOUS ACTIVITY: IP=${getClientIP(req)}, Path=${req.path}, Status=${res.statusCode}, Time=${new Date().toISOString()}`);
    }
  });
  
  next();
};

/**
 * Error tracking middleware
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: getClientIP(req),
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
  };
  
  // Log error with appropriate level
  if (err.statusCode >= 500 || !err.statusCode) {
    console.error('💥 SERVER ERROR:', JSON.stringify(errorInfo, null, 2));
  } else if (err.statusCode >= 400) {
    console.warn('⚠️ CLIENT ERROR:', JSON.stringify(errorInfo, null, 2));
  }
  
  next(err);
};

/**
 * API usage monitoring middleware
 */
export const apiUsageMonitor = (req: Request, res: Response, next: NextFunction) => {
  // Track API endpoint usage
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  
  res.on('finish', () => {
    // In a production environment, you would send this to a monitoring service
    // For now, we'll just log it in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 API USAGE: ${endpoint}, Status: ${res.statusCode}, User: ${(req as any).user?.role || 'anonymous'}`);
    }
  });
  
  next();
};

/**
 * Health check monitoring
 */
export const healthMonitor = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };
    
    console.log('💚 HEALTH CHECK:', JSON.stringify(healthData, null, 2));
  }
  
  next();
};

/**
 * Helper function to get client IP address
 */
function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('X-Forwarded-For') ||
    req.get('X-Real-IP') ||
    'unknown'
  );
}

/**
 * Format log message for better readability
 */
function formatLogMessage(metrics: RequestMetrics): string {
  const { method, url, statusCode, responseTime, ip, userId, userRole } = metrics;
  const user = userId ? `User:${userId}(${userRole})` : 'Anonymous';
  return `${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip} - ${user}`;
}

/**
 * Log security-related events
 */
function logSecurityEvents(req: Request, res: Response, metrics: RequestMetrics) {
  // Log rate limit hits
  if (res.statusCode === 429) {
    console.warn(`🚨 RATE LIMIT HIT: IP=${metrics.ip}, Path=${metrics.url}, Time=${metrics.timestamp}`);
  }
  
  // Log unauthorized access attempts
  if (res.statusCode === 401) {
    console.warn(`🔒 UNAUTHORIZED ACCESS: IP=${metrics.ip}, Path=${metrics.url}, Time=${metrics.timestamp}`);
  }
  
  // Log forbidden access attempts
  if (res.statusCode === 403) {
    console.warn(`🚫 FORBIDDEN ACCESS: IP=${metrics.ip}, Path=${metrics.url}, User=${metrics.userId}, Time=${metrics.timestamp}`);
  }
  
  // Log admin operations
  if (req.path.includes('/admin') && res.statusCode < 400) {
    console.log(`👑 ADMIN OPERATION: User=${metrics.userId}, Action=${req.method} ${req.path}, Time=${metrics.timestamp}`);
  }
}

/**
 * Log performance metrics
 */
function logPerformanceMetrics(metrics: RequestMetrics) {
  // Log slow requests
  if (metrics.responseTime > 1000) {
    console.warn(`🐌 SLOW REQUEST: ${metrics.method} ${metrics.url} took ${metrics.responseTime}ms`);
  }
  
  // Log large responses
  if (metrics.responseSize && metrics.responseSize > 1024 * 1024) { // 1MB
    console.warn(`📦 LARGE RESPONSE: ${metrics.method} ${metrics.url} response size: ${(metrics.responseSize / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // In production, you would send these metrics to a monitoring service like:
  // - New Relic
  // - DataDog
  // - CloudWatch
  // - Prometheus
}

/**
 * Database operation monitoring
 */
export const dbOperationLogger = (operation: string, collection: string, duration: number, error?: Error) => {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    error: error?.message,
  };
  
  if (error) {
    console.error('🗄️ DB ERROR:', JSON.stringify(logData, null, 2));
  } else if (duration > 500) {
    console.warn('🐌 SLOW DB QUERY:', JSON.stringify(logData, null, 2));
  } else if (process.env.NODE_ENV === 'development') {
    console.log('🗄️ DB OPERATION:', JSON.stringify(logData, null, 2));
  }
};