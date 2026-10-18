import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { authLimiter } from "../middleware/security";
import { registerSchema, loginSchema } from "../utils/validation";

const router = express.Router();

// Apply auth-specific rate limiting to all routes
router.use(authLimiter);

// Public routes with validation
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);

// Protected routes
router.get("/me", authenticate, getCurrentUser);

export default router;
