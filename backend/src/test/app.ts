import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth";
import productRoutes from "../routes/products";
import uploadRoutes from "../routes/upload";
import orderRoutes from "../routes/orders";
import pointRoutes from "../routes/points";
import userRoutes from "../routes/users";
import adminRoutes from "../routes/admin";
import emailRoutes from "../routes/email";
import staffRoutes from "../routes/staff";
import { globalErrorHandler } from "../middleware/errorHandler";
import {
  generalLimiter,
  corsOptions,
  helmetOptions,
  sanitizeInput,
  requestSizeLimiter,
  securityHeaders,
  validateCommonPatterns,
} from "../middleware/security";

// Create test app without database connection
export const createTestApp = () => {
  const app = express();

  // Trust proxy for accurate IP addresses
  app.set("trust proxy", 1);

  // Security middleware
  app.use(securityHeaders);
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));

  // Request validation and sanitization
  app.use(validateCommonPatterns);
  app.use(requestSizeLimiter);

  // Disable rate limiting for tests
  if (process.env.NODE_ENV !== 'test') {
    app.use(generalLimiter);
  }

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Input sanitization
  app.use(sanitizeInput);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      message: "BanhMi App Backend Test is running",
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/points", pointRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/email", emailRoutes);
  app.use("/api/staff", staffRoutes);

  // Global error handler
  app.use(globalErrorHandler);

  return app;
};