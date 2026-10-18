import { Router } from 'express';
import { uploadImageController } from '../controllers/uploadController';
import upload from '../middleware/upload';
import { authenticate, authorize } from '../middleware/auth';
import { uploadLimiter } from '../middleware/security';

const router = Router();

// Apply upload-specific rate limiting
router.use(uploadLimiter);

/**
 * POST /api/upload/image
 * Upload image to Cloudinary
 * Requires authentication and admin role
 */
router.post(
  '/image',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  uploadImageController
);

export default router;