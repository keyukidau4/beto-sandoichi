import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateObjectId } from '../middleware/validation';
import { orderLimiter, adminLimiter } from '../middleware/security';
import { orderSchema } from '../utils/validation';
import Joi from 'joi';

const router = express.Router();

// Order status update schema
const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'paid', 'cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, paid, cancelled',
      'any.required': 'Status is required'
    })
});

// Buyer routes - require authentication with order rate limiting
router.post('/', orderLimiter, authenticate, validateBody(orderSchema), createOrder);
router.get('/', authenticate, getUserOrders);
router.get('/:id', validateObjectId(), authenticate, getOrderById);

// Admin routes - require admin role with admin rate limiting
router.use('/admin', adminLimiter);
router.get('/admin/all', authenticate, authorize('admin'), getAllOrders);
router.put('/:id/status', validateObjectId(), authenticate, authorize('admin'), validateBody(orderStatusSchema), updateOrderStatus);

export default router;