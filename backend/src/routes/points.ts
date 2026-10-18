import express from 'express';
import { 
  getPointBalance,
  getPointHistory,
  validatePointsForPayment,
  getAllUserPoints,
  adminAdjustPoints,
  adminGetUserPointHistory,
  processOrderReward
} from '../controllers/pointController';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateObjectId } from '../middleware/validation';
import { adminLimiter } from '../middleware/security';
import Joi from 'joi';

const router = express.Router();

// Point validation schema
const pointValidationSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required'
    })
});

// Point adjustment schema
const pointAdjustmentSchema = Joi.object({
  points: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Points must be a whole number',
      'number.min': 'Points cannot be negative',
      'any.required': 'Points value is required'
    }),
  note: Joi.string()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Note must not exceed 200 characters'
    })
});

// User routes (require authentication)
router.get('/balance', authenticate, getPointBalance);
router.get('/history', authenticate, getPointHistory);
router.post('/validate', authenticate, validateBody(pointValidationSchema), validatePointsForPayment);

// Admin routes (require admin role) with enhanced rate limiting
router.use('/admin', adminLimiter);
router.get('/admin/users', authenticate, authorize('admin'), getAllUserPoints);
router.put('/admin/users/:userId/adjust', validateObjectId('userId'), authenticate, authorize('admin'), validateBody(pointAdjustmentSchema), adminAdjustPoints);
router.get('/admin/users/:userId/history', validateObjectId('userId'), authenticate, authorize('admin'), adminGetUserPointHistory);
router.post('/admin/orders/:orderId/reward', validateObjectId('orderId'), authenticate, authorize('admin'), processOrderReward);

export default router;