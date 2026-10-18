import { Request, Response } from 'express';
import { StockService } from '../services/stockService';
import { Product } from '../models';

/**
 * Get inventory overview for staff dashboard
 */
export const getInventoryOverview = async (req: Request, res: Response) => {
  try {
    const inventory = await StockService.getInventoryOverview();
    
    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory overview'
    });
  }
};

/**
 * Get low stock products (stock < 5)
 */
export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const lowStockProducts = await StockService.getLowStockProducts();
    
    res.status(200).json({
      success: true,
      data: lowStockProducts
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products'
    });
  }
};

/**
 * Get stock history for a specific product
 */
export const getProductStockHistory = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const history = await StockService.getProductStockHistory(productId);
    
    return res.status(200).json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          type: product.type,
          currentStock: product.stock
        },
        history
      }
    });
  } catch (error) {
    console.error('Error fetching product stock history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product stock history'
    });
  }
};

/**
 * Get recent stock history (all products)
 */
export const getRecentStockHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await StockService.getRecentStockHistory(limit);
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching recent stock history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent stock history'
    });
  }
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = async (req: Request, res: Response) => {
  try {
    const stats = await StockService.getInventoryStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory stats'
    });
  }
};

/**
 * Get product details (read-only for staff)
 */
export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        type: product.type,
        description: product.description,
        price: product.price,
        stock: product.stock,
        options: product.options,
        imageUrl: product.imageUrl,
        isLowStock: product.stock < 5,
        isOutOfStock: product.stock === 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product details'
    });
  }
};