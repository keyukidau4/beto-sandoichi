import express from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateObjectId } from "../middleware/validation";
import { adminLimiter } from "../middleware/security";
import Joi from "joi";
import {
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
} from "../controllers/adminOrderController";

const router = express.Router();

// Apply admin-specific rate limiting to all routes
router.use(adminLimiter);

// All routes require admin authentication
router.use(authenticate, authorize("admin"));

// Order status update validation schema
const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "paid", "cancelled")
    .required()
    .messages({
      "any.only": "Status must be one of: pending, paid, cancelled",
      "any.required": "Status is required",
    }),
});

/**
 * Admin Order Management Routes
 * All routes require admin authentication and rate limiting
 */

// Get all orders with filtering and search
router.get("/", getAdminOrders);

// Get specific order details
router.get("/:id", validateObjectId(), getAdminOrderDetail);

// Update order status
router.put(
  "/:id/status",
  validateObjectId(),
  validateBody(orderStatusSchema),
  updateAdminOrderStatus
);

export default router;
