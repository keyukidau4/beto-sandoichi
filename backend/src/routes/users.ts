import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody, validateObjectId } from '../middleware/validation';
import { adminLimiter } from '../middleware/security';
import { contactRequestSchema } from '../utils/validation';
import Joi from 'joi';
import {
  getUsers,
  updateUserStatus,
  updateUserPoints,
  getContactRequests,
  createContactRequest,
  updateContactRequest,
  getUserContactRequests,
  bulkUpdateUserStatus,
  getUserStatistics
} from '../controllers/userController';

const router = express.Router();

// User status update validation schema
const userStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'blacklisted')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, approved, blacklisted',
      'any.required': 'Status is required'
    })
});

// Bulk user status update validation schema
const bulkStatusSchema = Joi.object({
  userIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid user ID format'
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one user must be selected',
      'any.required': 'User IDs are required'
    }),
  status: Joi.string()
    .valid('pending', 'approved', 'blacklisted')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, approved, blacklisted',
      'any.required': 'Status is required'
    })
});

// User points update validation schema
const userPointsSchema = Joi.object({
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

// Contact request update validation schema
const contactRequestUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'done')
    .required()
    .messages({
      'any.only': 'Status must be either "pending" or "done"',
      'any.required': 'Status is required'
    }),
  adminResponse: Joi.string()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Admin response must not exceed 1000 characters'
    })
});

// Contact request routes (buyer access)
router.post('/contact', authenticate, validateBody(contactRequestSchema), createContactRequest);
router.get('/contact', authenticate, getUserContactRequests);

// Admin routes with enhanced rate limiting and validation
router.use(adminLimiter); // Apply admin rate limiting to admin routes

router.get('/', authenticate, authorize('admin'), getUsers);
router.get('/statistics', authenticate, authorize('admin'), getUserStatistics);
router.put('/:userId/status', validateObjectId('userId'), authenticate, authorize('admin'), validateBody(userStatusSchema), updateUserStatus);
router.put('/bulk/status', authenticate, authorize('admin'), validateBody(bulkStatusSchema), bulkUpdateUserStatus);
router.put('/:userId/points', validateObjectId('userId'), authenticate, authorize('admin'), validateBody(userPointsSchema), updateUserPoints);
router.get('/admin/contact', authenticate, authorize('admin'), getContactRequests);
router.put('/contact/:id', validateObjectId(), authenticate, authorize('admin'), validateBody(contactRequestUpdateSchema), updateContactRequest);

export default router;