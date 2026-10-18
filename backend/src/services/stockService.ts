import { Product, StockHistory, IStockHistory } from '../models';
import mongoose from 'mongoose';

export interface StockChangeData {
  productId: string;
  changeType: 'order_deduction' | 'admin_adjustment' | 'restock';
  changeAmount: number;
  orderId?: string;
  adminId?: string;
  note?: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  type: 'banhmi' | 'drink';
  stock: number;
  isLowStock: boolean;
  imageUrl?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistoryItem {
  _id: string;
  productId: string;
  productName: string;
  changeType: 'order_deduction' | 'admin_adjustment' | 'restock';
  previousStock: number;
  newStock: number;
  changeAmount: number;
  orderId?: string;
  adminId?: string;
  note?: string;
  createdAt: string;
}

export class StockService {
  /**
   * Record stock change and update product stock
   */
  static async recordStockChange(data: StockChangeData): Promise<IStockHistory> {
    try {
      // Get current product
      const product = await Product.findById(data.productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const previousStock = product.stock;
      const newStock = previousStock + data.changeAmount;

      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      // Update product stock
      await Product.findByIdAndUpdate(
        data.productId,
        { stock: newStock }
      );

      // Create stock history record
      const stockHistory = new StockHistory({
        productId: data.productId,
        changeType: data.changeType,
        previousStock,
        newStock,
        changeAmount: data.changeAmount,
        orderId: data.orderId ? new mongoose.Types.ObjectId(data.orderId) : undefined,
        adminId: data.adminId ? new mongoose.Types.ObjectId(data.adminId) : undefined,
        note: data.note
      });

      await stockHistory.save();

      return stockHistory;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get inventory overview for staff dashboard
   */
  static async getInventoryOverview(): Promise<InventoryItem[]> {
    const products = await Product.find({})
      .select('name type stock imageUrl price createdAt updatedAt')
      .sort({ name: 1 });

    return products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      type: product.type,
      stock: product.stock,
      isLowStock: product.stock < 5,
      imageUrl: product.imageUrl,
      price: product.price,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }));
  }

  /**
   * Get low stock products (stock < 5)
   */
  static async getLowStockProducts(): Promise<InventoryItem[]> {
    const products = await Product.find({ stock: { $lt: 5 } })
      .select('name type stock imageUrl price createdAt updatedAt')
      .sort({ stock: 1, name: 1 });

    return products.map(product => ({
      _id: product._id.toString(),
      name: product.name,
      type: product.type,
      stock: product.stock,
      isLowStock: true,
      imageUrl: product.imageUrl,
      price: product.price,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }));
  }

  /**
   * Get stock history for a specific product
   */
  static async getProductStockHistory(productId: string): Promise<StockHistoryItem[]> {
    const history = await StockHistory.find({ productId })
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    return history.map(item => ({
      _id: item._id.toString(),
      productId: item.productId.toString(),
      productName: (item.productId as any).name,
      changeType: item.changeType,
      previousStock: item.previousStock,
      newStock: item.newStock,
      changeAmount: item.changeAmount,
      orderId: item.orderId?.toString(),
      adminId: item.adminId?.toString(),
      note: item.note,
      createdAt: item.createdAt.toISOString()
    }));
  }

  /**
   * Get overall stock history (recent changes)
   */
  static async getRecentStockHistory(limit: number = 20): Promise<StockHistoryItem[]> {
    const history = await StockHistory.find({})
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    return history.map(item => ({
      _id: item._id.toString(),
      productId: item.productId.toString(),
      productName: (item.productId as any).name,
      changeType: item.changeType,
      previousStock: item.previousStock,
      newStock: item.newStock,
      changeAmount: item.changeAmount,
      orderId: item.orderId?.toString(),
      adminId: item.adminId?.toString(),
      note: item.note,
      createdAt: item.createdAt.toISOString()
    }));
  }

  /**
   * Get inventory statistics
   */
  static async getInventoryStats() {
    const [totalProducts, lowStockCount, outOfStockCount, totalStockValue] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ stock: { $lt: 5, $gt: 0 } }),
      Product.countDocuments({ stock: 0 }),
      Product.aggregate([
        { $match: { del_flg: { $ne: true } } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stock', '$price'] } } } }
      ])
    ]);

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalStockValue: totalStockValue[0]?.totalValue || 0
    };
  }
}