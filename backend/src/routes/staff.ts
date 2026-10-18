import express from 'express';
import {
  getInventoryOverview,
  getLowStockProducts,
  getProductStockHistory,
  getRecentStockHistory,
  getInventoryStats,
  getProductDetails
} from '../controllers/staffController';
import { authenticate, authorize } from '../middleware/auth';
import { validateObjectId } from '../middleware/validation';

const router = express.Router();

// All staff routes require authentication and staff/admin role
router.use(authenticate);
router.use(authorize('staff', 'admin'));

// GET /api/staff/inventory - Get inventory overview
router.get('/inventory', getInventoryOverview);

// GET /api/staff/inventory/low-stock - Get low stock products
router.get('/inventory/low-stock', getLowStockProducts);

// GET /api/staff/inventory/stats - Get inventory statistics
router.get('/inventory/stats', getInventoryStats);

// GET /api/staff/inventory/history - Get recent stock history
router.get('/inventory/history', getRecentStockHistory);

// GET /api/staff/products/:productId - Get product details (read-only)
router.get('/products/:productId', validateObjectId('productId'), getProductDetails);

// GET /api/staff/products/:productId/history - Get product stock history
router.get('/products/:productId/history', validateObjectId('productId'), getProductStockHistory);

export default router;