import { Request, Response } from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { BuyerProfile } from "../models/BuyerProfile";

/**
 * Admin Order Management Controller
 * Handles admin-specific order operations
 */

export interface AdminOrderListItem {
  _id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  paymentType: '代引き' | 'ポイント';
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
  itemCount: number;
}

export interface OrderFilters {
  status?: 'pending' | 'paid' | 'cancelled';
  paymentType?: '代引き' | 'ポイント';
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

/**
 * Get all orders with filtering and search for admin
 * GET /api/admin/orders
 */
export const getAdminOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Extract filters from query parameters
    const filters: OrderFilters = {};
    if (req.query.status) filters.status = req.query.status as any;
    if (req.query.paymentType) filters.paymentType = req.query.paymentType as any;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    if (req.query.searchTerm) filters.searchTerm = req.query.searchTerm as string;

    // Build aggregation pipeline
    const pipeline: any[] = [
      // Match non-deleted orders
      { $match: { del_flg: false } },
    ];

    // Apply status filter
    if (filters.status) {
      pipeline.push({ $match: { status: filters.status } });
    }

    // Apply payment type filter
    if (filters.paymentType) {
      pipeline.push({ $match: { paymentType: filters.paymentType } });
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      const dateMatch: any = {};
      if (filters.dateFrom) {
        dateMatch.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        dateMatch.$lt = endDate;
      }
      pipeline.push({ $match: { createdAt: dateMatch } });
    }

    // Lookup buyer information
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "buyerId",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $lookup: {
          from: "buyerprofiles",
          localField: "buyerId",
          foreignField: "userId",
          as: "buyerProfile",
        },
      },
      { $unwind: "$buyerProfile" }
    );

    // Apply search filter (search in buyer name, email, or order ID)
    if (filters.searchTerm) {
      const searchRegex = new RegExp(filters.searchTerm, 'i');
      pipeline.push({
        $match: {
          $or: [
            { "buyer.email": searchRegex },
            { "buyerProfile.name": searchRegex },
            { "_id": mongoose.Types.ObjectId.isValid(filters.searchTerm) 
              ? new mongoose.Types.ObjectId(filters.searchTerm) 
              : null 
            }
          ].filter(condition => condition !== null)
        }
      });
    }

    // Project the required fields
    pipeline.push({
      $project: {
        _id: 1,
        orderNumber: { $toString: "$_id" },
        buyerName: "$buyerProfile.name",
        buyerEmail: "$buyer.email",
        totalAmount: 1,
        paymentType: 1,
        status: 1,
        createdAt: 1,
        itemCount: { $size: "$items" },
      },
    });

    // Sort by creation date (newest first)
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Order.aggregate(countPipeline);
    const totalOrders = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute the aggregation
    const orders = await Order.aggregate(pipeline);

    const totalPages = Math.ceil(totalOrders / limit);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      message: "Orders retrieved successfully",
    });
  } catch (error) {
    console.error("Get admin orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Get detailed order information for admin
 * GET /api/admin/orders/:id
 */
export const getAdminOrderDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Get order with full details
    const orderDetails = await Order.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id), del_flg: false } },
      {
        $lookup: {
          from: "users",
          localField: "buyerId",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $lookup: {
          from: "buyerprofiles",
          localField: "buyerId",
          foreignField: "userId",
          as: "buyerProfile",
        },
      },
      { $unwind: "$buyerProfile" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          orderNumber: { $toString: "$_id" },
          buyerName: "$buyerProfile.name",
          buyerEmail: "$buyer.email",
          totalAmount: 1,
          paymentType: 1,
          status: 1,
          pointsUsed: 1,
          pointsEarned: 1,
          createdAt: 1,
          updatedAt: 1,
          deliveryAddress: {
            name: "$buyerProfile.name",
            tel: "$buyerProfile.tel",
            zip: { $concat: ["$buyerProfile.zip1", "-", "$buyerProfile.zip2"] },
            address: { $concat: ["$buyerProfile.address1", " ", "$buyerProfile.address2"] },
          },
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                productId: "$$item.productId",
                productName: {
                  $let: {
                    vars: {
                      product: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$productDetails",
                              cond: { $eq: ["$$this._id", "$$item.productId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$product.name",
                  },
                },
                quantity: "$$item.quantity",
                selectedOptions: "$$item.selectedOptions",
                subtotal: "$$item.subtotal",
              },
            },
          },
        },
      },
    ]);

    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: orderDetails[0],
      message: "Order details retrieved successfully",
    });
  } catch (error) {
    console.error("Get admin order detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Update order status (admin only)
 * PUT /api/admin/orders/:id/status
 */
export const updateAdminOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    // Validate status
    if (!status || !["pending", "paid", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (pending, paid, cancelled)",
      });
    }

    // Find and update the order
    const order = await Order.findOneAndUpdate(
      { _id: id, del_flg: false },
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("items.productId", "name type price imageUrl");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: order,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Update admin order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};