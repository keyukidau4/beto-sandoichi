import { Request, Response } from 'express';
import { Product, IProduct } from '../models/Product';
import { ProductView } from '../models/ProductView';
import { validateProduct } from '../utils/validation';
import mongoose from 'mongoose';

// Helper function to track product views (excluding admin/staff)
const trackProductView = async (productId: string, userRole?: string) => {
  // Only track views for buyers or unauthenticated users
  if (userRole === 'admin' || userRole === 'staff') {
    return;
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    await ProductView.findOneAndUpdate(
      { productId: new mongoose.Types.ObjectId(productId), date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
    return
  } catch (error) {
    console.error('Error tracking product view:', error);
    // Don't throw error as view tracking is not critical
    return
  }
};

// GET /api/products - Get all products with optional filtering
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (type && (type === 'banhmi' || type === 'drink')) {
      filter.type = type;
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string))); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Get products with pagination
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// GET /api/products/:id - Get single product with view tracking
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find product
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Track product view (async, don't wait for completion)
    trackProductView(id, req.user?.role);

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// POST /api/products - Create new product (Admin only)
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Create new product
    const product = new Product(value);
    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// PUT /api/products/:id - Update product (Admin only)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Validate request body
    const { error, value } = validateProduct(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      id,
      { ...value, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

// DELETE /api/products/:id - Soft delete product (Admin only)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Soft delete product by setting del_flg to true
    const product = await Product.findByIdAndUpdate(
      id,
      { del_flg: true, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// POST /api/products/:id/view - Manual view tracking endpoint (optional)
export const trackView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Track view
    await trackProductView(id, req.user?.role);

    return res.status(200).json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
};