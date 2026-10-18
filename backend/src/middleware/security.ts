import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

/**
 * Enhanced rate limiting configurations for different endpoints
 */

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    status: "error",
    message: "Too many authentication attempts, please try again later.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate rate limiting for order creation
export const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 orders per 5 minutes
  message: {
    status: "error",
    message: "Too many order attempts, please try again later.",
    code: "ORDER_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for admin operations
export const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // limit each IP to 50 admin operations per 10 minutes
  message: {
    status: "error",
    message: "Too many admin operations, please try again later.",
    code: "ADMIN_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 uploads per 10 minutes
  message: {
    status: "error",
    message: "Too many upload attempts, please try again later.",
    code: "UPLOAD_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for bulk email operations
export const bulkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each admin to 5 bulk emails per 15 minutes
  message: {
    status: "error",
    message: "Too many bulk email requests, please try again later.",
    code: "BULK_EMAIL_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Enhanced CORS configuration
 */
export const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Debug logging
    console.log(
      `🔍 CORS Check - Origin: ${origin}, NODE_ENV: ${process.env.NODE_ENV}`
    );

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("✅ CORS: Allowing request with no origin");
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:3000", // Alternative frontend port
      "http://localhost:5174", // Alternative Vite port
    ];

    console.log(`🔍 CORS: Allowed origins: ${allowedOrigins.join(", ")}`);

    // In production, only allow specific origins
    if (process.env.NODE_ENV === "production") {
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("✅ CORS: Origin allowed in production");
        callback(null, true);
      } else {
        console.log("❌ CORS: Origin rejected in production");
        callback(new Error("Not allowed by CORS"), false);
      }
    } else {
      // In development, allow all origins temporarily for debugging
      console.log("✅ CORS: Allowing all origins in development (debug mode)");
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
  ],
  exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
  maxAge: 86400, // 24 hours
};

/**
 * Enhanced Helmet configuration for security headers
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://res.cloudinary.com",
        "https://cloudinary.com",
      ],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'",
        process.env.FRONTEND_URL || "http://localhost:5173",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      ...(process.env.NODE_ENV === "production" && {
        upgradeInsecureRequests: [],
      }),
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Cloudinary compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" as const },
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" as const },
};

/**
 * Input sanitization middleware to prevent XSS and injection attacks
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Recursively sanitize object properties
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      // Remove potentially dangerous characters and scripts
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
        .replace(/javascript:/gi, "") // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, "") // Remove event handlers like onclick=
        .replace(/&lt;script/gi, "") // Remove encoded script tags
        .replace(/&gt;/gi, ">") // Decode HTML entities
        .replace(/&lt;/gi, "<")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#x27;/gi, "'");
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Sanitize both key and value
          const sanitizedKey = typeof key === "string" ? sanitize(key) : key;
          sanitized[sanitizedKey] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Sanitize query parameters
  // if (req.query) {
  //   req.query = sanitize(req.query);
  // }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Request size limiting middleware
 */
export const requestSizeLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const contentLength = req.get("content-length");

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    if (size > maxSize) {
      return res.status(413).json({
        status: "error",
        message: "Request entity too large",
        code: "REQUEST_TOO_LARGE",
      });
    }
  }

  return next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove server information
  res.removeHeader("X-Powered-By");

  // Add custom security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  // Add cache control for sensitive endpoints
  if (req.path.includes("/api/auth") || req.path.includes("/api/admin")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

/**
 * Request validation middleware for common patterns
 */
export const validateCommonPatterns = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /\/\//, // Double slashes
    /%2e%2e/i, // Encoded directory traversal
    /%00/i, // Null byte
    /script/i, // Script injection attempts
    /union.*select/i, // SQL injection attempts
    /drop.*table/i, // SQL injection attempts
  ];

  const url = req.originalUrl.toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request pattern detected",
        code: "INVALID_REQUEST_PATTERN",
      });
    }
  }

  return next();
};
