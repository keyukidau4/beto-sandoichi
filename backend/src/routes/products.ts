import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  trackView
} from '../controllers/productController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validateBody, validateObjectId } from '../middleware/validation';
import { adminLimiter } from '../middleware/security';
import { productSchema } from '../utils/validation';

const router = express.Router();

// GET /api/products - Get all products (public, with optional auth for view tracking)
router.get('/', optionalAuth, getProducts);

// GET /api/products/:id - Get single product with view tracking (public, with optional auth)
router.get('/:id', validateObjectId(), optionalAuth, getProductById);

// POST /api/products/:id/view - Manual view tracking (public, with optional auth)
router.post('/:id/view', validateObjectId(), optionalAuth, trackView);

// Admin routes with enhanced rate limiting and validation
router.use(adminLimiter); // Apply admin rate limiting to admin routes

// POST /api/products - Create new product (Admin only)
router.post('/', authenticate, authorize('admin'), validateBody(productSchema), createProduct);

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', validateObjectId(), authenticate, authorize('admin'), validateBody(productSchema), updateProduct);

// DELETE /api/products/:id - Soft delete product (Admin only)
router.delete('/:id', validateObjectId(), authenticate, authorize('admin'), deleteProduct);

export default router;