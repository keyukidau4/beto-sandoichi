import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/database";
import { config, validateConfig } from "./config/environment";
import { testCloudinaryConnection } from "./config/cloudinary";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import uploadRoutes from "./routes/upload";
import orderRoutes from "./routes/orders";
import pointRoutes from "./routes/points";
import userRoutes from "./routes/users";
import adminRoutes from "./routes/admin";
import adminOrderRoutes from "./routes/adminOrders";
import emailRoutes from "./routes/email";
import staffRoutes from "./routes/staff";
import { globalErrorHandler, handleNotFound } from "./middleware/errorHandler";
import {
  generalLimiter,
  corsOptions,
  helmetOptions,
  sanitizeInput,
  requestSizeLimiter,
  securityHeaders,
  validateCommonPatterns,
} from "./middleware/security";
import {
  requestLogger,
  securityLogger,
  errorLogger,
  apiUsageMonitor,
  healthMonitor,
} from "./middleware/monitoring";
// Validate configuration before starting
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

const app = express();
const PORT = config.port;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// Security middleware - order matters!
app.use(securityHeaders);
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

// Request validation and sanitization
app.use(validateCommonPatterns);
app.use(requestSizeLimiter);

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      // Additional JSON validation
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Input sanitization (after body parsing)
app.use(sanitizeInput);

// Monitoring and logging middleware
app.use(requestLogger);
app.use(securityLogger);
app.use(apiUsageMonitor);
// app.use(healthMonitor);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "BanhMi App Backend is running",
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
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/email", emailRoutes);
app.use("/api/staff", staffRoutes);

// Handle undefined API routes
// app.use('/api/*', handleNotFound);

// Error logging middleware (before global error handler)
app.use(errorLogger);

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

// Initialize database connection and start server
const startServer = async () => {
  try {
    console.log(`🚀 Starting BanhMi App Backend...`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔧 Configuration loaded from: .env.${config.nodeEnv}`);

    // Connect to MongoDB
    await connectDB();

    // Test external services in production
    if (config.nodeEnv === 'production') {
      console.log('🔍 Testing external services...');
      
      // Test Cloudinary connection
      const cloudinaryOk = await testCloudinaryConnection();
      if (!cloudinaryOk) {
        console.warn('⚠️  Cloudinary connection failed - image upload may not work');
      }
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 BanhMi App Backend API`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
      console.log(`✅ Server started successfully`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
