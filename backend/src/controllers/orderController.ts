import { Request, Response } from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { BuyerProfile } from "../models/BuyerProfile";
import { User } from "../models/User";
import { PointService } from "../services/pointService";
import { PointTransaction } from "../models/PointTransaction";
import { StockService } from "../services/stockService";
import { emailService } from "../services/emailService";

// Create new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, paymentType } = req.body;
    const buyerId = req.user!._id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order items are required",
      });
    }

    if (!paymentType || !["代引き", "ポイント"].includes(paymentType)) {
      return res.status(400).json({
        message: "Valid payment type is required (代引き or ポイント)",
      });
    }

    // Get buyer profile
    const buyerProfile = await BuyerProfile.findOne({ userId: buyerId });
    if (!buyerProfile) {
      return res.status(404).json({
        message: "Buyer profile not found",
      });
    }

    // Check if buyer is approved for point payments
    if (paymentType === "ポイント" && req.user!.status !== "approved") {
      return res.status(403).json({
        message: "Account pending approval. Only COD payment available.",
      });
    }

    let totalAmount = 0;
    const processedItems = [];

    // Process each item and validate stock
    for (const item of items) {
      const { productId, quantity, selectedOptions = [] } = item;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({
          message: "Invalid item data",
        });
      }

      // Get product and check stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${productId}`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
        });
      }

      // Calculate subtotal including options
      let subtotal = product.price * quantity;

      // Add option costs
      for (const optionName of selectedOptions) {
        const option = product.options.find((opt) => opt.name === optionName);
        if (option) {
          subtotal += option.extraCost * quantity;
        }
      }

      processedItems.push({
        productId: product._id,
        quantity,
        selectedOptions,
        subtotal,
      });

      totalAmount += subtotal;

      // Deduct stock
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -quantity },
      });
    }

    // For point payments, validate and deduct points
    let pointsUsed = 0;
    let pointDeductTransaction: any = null;
    if (paymentType === "ポイント") {
      // Validate points using PointService
      const validation = await PointService.validatePointsForPayment(
        buyerId,
        totalAmount
      );
      if (!validation.isValid) {
        return res.status(400).json({
          message: validation.message,
        });
      }

      pointsUsed = totalAmount;

      // Deduct points using PointService
      const deductResult = await PointService.deductPoints(
        buyerId,
        pointsUsed,
        `Points used for order payment`
      );

      if (!deductResult.success) {
        return res.status(400).json({
          message: deductResult.error,
        });
      }

      pointDeductTransaction = deductResult.transaction;
    }

    // Calculate points earned using PointService
    const pointsEarned = PointService.calculatePointsEarned(totalAmount);

    // Create the order
    const order = await Order.create({
      buyerId,
      items: processedItems,
      paymentType,
      totalAmount,
      pointsUsed,
      pointsEarned,
      status: paymentType === "ポイント" ? "paid" : "pending",
    });

    // Update point deduction transaction with orderId if it exists
    if (pointDeductTransaction && pointDeductTransaction._id) {
      await PointService.updateTransactionWithOrderId(
        pointDeductTransaction._id,
        order._id
      );
    }

    // Record stock history for each item
    for (const item of processedItems) {
      try {
        await StockService.recordStockChange({
          productId: item.productId.toString(),
          changeType: "order_deduction",
          changeAmount: -item.quantity,
          orderId: order._id.toString(),
          note: `Stock deducted for order ${order._id}`,
        });
      } catch (stockError) {
        console.error("Failed to record stock history:", stockError);
        // Don't fail the order creation, just log the error
      }
    }

    // For COD orders, add points earned using PointService
    if (paymentType === "代引き" && pointsEarned > 0) {
      const rewardResult = await PointService.addPoints(
        buyerId,
        pointsEarned,
        "purchase_reward",
        `Points earned from order ${order._id}`,
        order._id
      );

      if (!rewardResult.success) {
        console.error("Failed to add reward points:", rewardResult.error);
        // Don't fail the order creation, just log the error
      }
    }

    // Populate the order with product details
    const populatedOrder = await Order.findById(order._id)
      .populate("items.productId", "name type price imageUrl")
      .populate("buyerId", "email");

    // Send automated order confirmation email
    try {
      const user = await User.findById(buyerId);
      if (user && buyerProfile) {
        await emailService.sendAutomatedEmail('order_confirmation', user.email, {
          name: buyerProfile.name,
          email: user.email,
          orderNumber: order._id.toString(),
          totalAmount: totalAmount,
          orderStatus: order.status === 'paid' ? '支払い済み' : '注文受付',
          currentDate: new Date().toLocaleDateString('ja-JP'),
          systemName: 'BanhMi App'
        });
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    return res.status(201).json({
      code: 201,
      success:true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      message: "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get user order history
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const buyerId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get orders with pagination
    const orders = await Order.find({ buyerId })
      .populate("items.productId", "name type price imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments({ buyerId });
    const totalPages = Math.ceil(totalOrders / limit);

    return res.json({
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Get order details by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const buyerId = req.user!._id;

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID format",
      });
    }

    // Find order and ensure it belongs to the authenticated user (unless admin)
    const query: any = { _id: id };
    if (req.user!.role === "buyer") {
      query.buyerId = buyerId;
    }

    const order = await Order.findOne(query)
      .populate("items.productId", "name type price imageUrl description")
      .populate("buyerId", "email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Get related point transactions
    const pointTransactions = await PointTransaction.find({
      orderId: order._id,
    }).sort({ createdAt: -1 });

    return res.json({
      data: order,
      pointTransactions,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      message: "Failed to fetch order details",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const paymentType = req.query.paymentType as string;

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (paymentType) {
      query.paymentType = paymentType;
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .populate("items.productId", "name type price imageUrl")
      .populate("buyerId", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    return res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID format",
      });
    }

    // Validate status
    if (!status || !["pending", "paid", "cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Valid status is required (pending, paid, cancelled)",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("items.productId", "name type price imageUrl")
     .populate("buyerId", "email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Send automated status update email
    try {
      const user = await User.findById(order.buyerId);
      const buyerProfile = await BuyerProfile.findOne({ userId: order.buyerId });
      
      if (user && buyerProfile) {
        const statusText = status === 'paid' ? '支払い済み' : 
                          status === 'cancelled' ? 'キャンセル' : '注文受付';
        
        await emailService.sendAutomatedEmail('status_update', user.email, {
          name: buyerProfile.name,
          email: user.email,
          orderNumber: order._id.toString(),
          orderStatus: statusText,
          currentDate: new Date().toLocaleDateString('ja-JP'),
          systemName: 'BanhMi App'
        });
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    return res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
