import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({
  register,
  prefix: 'banhmi_app_',
});

// Custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'banhmi_app_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'banhmi_app_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'banhmi_app_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const ordersTotal = new client.Counter({
  name: 'banhmi_app_orders_total',
  help: 'Total number of orders',
  labelNames: ['status', 'payment_type'],
  registers: [register],
});

const ordersFailed = new client.Counter({
  name: 'banhmi_app_orders_failed_total',
  help: 'Total number of failed orders',
  labelNames: ['reason'],
  registers: [register],
});

const authFailures = new client.Counter({
  name: 'banhmi_app_auth_failures_total',
  help: 'Total number of authentication failures',
  labelNames: ['type'],
  registers: [register],
});

const productStock = new client.Gauge({
  name: 'banhmi_app_product_stock_count',
  help: 'Current stock count for products',
  labelNames: ['product_id', 'product_name'],
  registers: [register],
});

const databaseConnections = new client.Gauge({
  name: 'banhmi_app_database_connections',
  help: 'Number of database connections',
  labelNames: ['state'],
  registers: [register],
});

// Middleware to collect HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    // Record metrics
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
    
    // Decrease active connections
    activeConnections.dec();
  });
  
  next();
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};

// Helper functions to update custom metrics
export const metrics = {
  // Order metrics
  recordOrder: (status: string, paymentType: string) => {
    ordersTotal.inc({ status, payment_type: paymentType });
  },
  
  recordOrderFailure: (reason: string) => {
    ordersFailed.inc({ reason });
  },
  
  // Authentication metrics
  recordAuthFailure: (type: string) => {
    authFailures.inc({ type });
  },
  
  // Product metrics
  updateProductStock: (productId: string, productName: string, stock: number) => {
    productStock.set({ product_id: productId, product_name: productName }, stock);
  },
  
  // Database metrics
  updateDatabaseConnections: (active: number, idle: number) => {
    databaseConnections.set({ state: 'active' }, active);
    databaseConnections.set({ state: 'idle' }, idle);
  },
  
  // Get registry for testing
  getRegister: () => register,
};