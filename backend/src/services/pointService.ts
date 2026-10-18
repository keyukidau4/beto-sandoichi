import mongoose from "mongoose";
import { BuyerProfile } from "../models/BuyerProfile";
import { PointTransaction } from "../models/PointTransaction";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { emailService } from "./emailService";

export interface PointCalculationResult {
  pointsEarned: number;
  pointsUsed: number;
}

export interface PointValidationResult {
  isValid: boolean;
  availablePoints: number;
  requiredPoints: number;
  message?: string;
}

export class PointService {
  /**
   * Calculate points earned from order total (100円 = 1 point)
   */
  static calculatePointsEarned(totalAmount: number): number {
    return Math.floor(totalAmount / 100);
  }

  /**
   * Validate if user has enough points for payment
   */
  static async validatePointsForPayment(
    userId: mongoose.Types.ObjectId,
    requiredPoints: number
  ): Promise<PointValidationResult> {
    try {
      const buyerProfile = await BuyerProfile.findOne({ userId });

      if (!buyerProfile) {
        return {
          isValid: false,
          availablePoints: 0,
          requiredPoints,
          message: "Buyer profile not found",
        };
      }

      const isValid = buyerProfile.point >= requiredPoints;

      return {
        isValid,
        availablePoints: buyerProfile.point,
        requiredPoints,
        message: isValid
          ? undefined
          : `Insufficient points. Available: ${buyerProfile.point}, Required: ${requiredPoints}`,
      };
    } catch (error) {
      console.error("Point validation error:", error);
      return {
        isValid: false,
        availablePoints: 0,
        requiredPoints,
        message: "Failed to validate points",
      };
    }
  }

  /**
   * Add points to user account and create transaction record
   */
  static async addPoints(
    userId: mongoose.Types.ObjectId,
    amount: number,
    type: "purchase_reward" | "bank_deposit_transfer_add",
    note: string,
    orderId?: mongoose.Types.ObjectId
  ): Promise<{ success: boolean; transaction?: any; error?: string }> {
    try {
      if (amount <= 0) {
        return { success: false, error: "Amount must be positive" };
      }

      // Update buyer profile points
      const buyerProfile = await BuyerProfile.findOneAndUpdate(
        { userId },
        { $inc: { point: amount } },
        { new: true }
      );

      if (!buyerProfile) {
        return { success: false, error: "Buyer profile not found" };
      }

      // Create point transaction record
      const transactionData = {
        userId,
        type,
        amount,
        note,
        ...(orderId && { orderId }),
      };

      const transaction = await PointTransaction.create(transactionData);

      // Send automated point notification email for significant point additions
      if (amount >= 100) {
        // Only send email for 100+ points to avoid spam
        try {
          const user = await User.findById(userId);
          if (user) {
            await emailService.sendAutomatedEmail(
              "point_notification",
              user.email,
              {
                name: buyerProfile.name || user.email,
                email: user.email,
                point: buyerProfile.point,
                currentDate: new Date().toLocaleDateString("ja-JP"),
                systemName: "BanhMi App",
              }
            );
          }
        } catch (emailError) {
          console.error("Failed to send point notification email:", emailError);
          // Don't fail the point addition if email fails
        }
      }

      return { success: true, transaction };
    } catch (error) {
      console.error("Add points error:", error);
      return { success: false, error: "Failed to add points" };
    }
  }

  /**
   * Deduct points from user account and create transaction record
   */
  static async deductPoints(
    userId: mongoose.Types.ObjectId,
    amount: number,
    note: string,
    orderId?: mongoose.Types.ObjectId
  ): Promise<{ success: boolean; transaction?: any; error?: string }> {
    try {
      if (amount <= 0) {
        return { success: false, error: "Amount must be positive" };
      }

      // Validate points before deduction
      const validation = await this.validatePointsForPayment(userId, amount);
      if (!validation.isValid) {
        return { success: false, error: validation.message };
      }

      // Update buyer profile points
      const buyerProfile = await BuyerProfile.findOneAndUpdate(
        { userId },
        { $inc: { point: -amount } },
        { new: true }
      );

      if (!buyerProfile) {
        return { success: false, error: "Buyer profile not found" };
      }

      // Create point transaction record (negative amount for deduction)
      const transactionData = {
        userId,
        type: "purchase_deduction" as const,
        amount: -amount, // Store as negative for deduction
        note,
        ...(orderId && { orderId }),
      };

      const transaction = await PointTransaction.create(transactionData);

      return { success: true, transaction };
    } catch (error) {
      console.error("Deduct points error:", error);
      return { success: false, error: "Failed to deduct points" };
    }
  }

  /**
   * Get user's point transaction history
   */
  static async getPointHistory(
    userId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    transactions: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTransactions: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      // Get transactions with pagination
      const transactions = await PointTransaction.find({ userId })
        .populate("orderId", "totalAmount status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const totalTransactions = await PointTransaction.countDocuments({
        userId,
      });
      const totalPages = Math.ceil(totalTransactions / limit);

      return {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      console.error("Get point history error:", error);
      throw new Error("Failed to fetch point history");
    }
  }

  /**
   * Get user's current point balance
   */
  static async getPointBalance(
    userId: mongoose.Types.ObjectId
  ): Promise<number> {
    try {
      const buyerProfile = await BuyerProfile.findOne({ userId });
      return buyerProfile?.point || 0;
    } catch (error) {
      console.error("Get point balance error:", error);
      return 0;
    }
  }

  /**
   * Process point rewards for completed order (COD payments)
   */
  static async processOrderReward(
    orderId: mongoose.Types.ObjectId
  ): Promise<{ success: boolean; pointsEarned?: number; error?: string }> {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      // Only process rewards for COD orders
      if (order.paymentType !== "代引き") {
        return { success: false, error: "Point rewards only for COD orders" };
      }

      // Check if points already earned
      if (order.pointsEarned && order.pointsEarned > 0) {
        const existingTransaction = await PointTransaction.findOne({
          orderId: order._id,
          type: "purchase_reward",
        });

        if (existingTransaction) {
          return {
            success: false,
            error: "Points already earned for this order",
          };
        }
      }

      const pointsEarned = this.calculatePointsEarned(order.totalAmount);

      if (pointsEarned <= 0) {
        return { success: false, error: "No points to earn from this order" };
      }

      // Add points to user account
      const result = await this.addPoints(
        order.buyerId,
        pointsEarned,
        "purchase_reward",
        `Points earned from order ${order._id}`,
        order._id
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Update order with points earned
      await Order.findByIdAndUpdate(orderId, { pointsEarned });

      return { success: true, pointsEarned };
    } catch (error) {
      console.error("Process order reward error:", error);
      return { success: false, error: "Failed to process order reward" };
    }
  }

  /**
   * Update a point transaction with orderId (used after order creation)
   */
  static async updateTransactionWithOrderId(
    transactionId: mongoose.Types.ObjectId,
    orderId: mongoose.Types.ObjectId
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await PointTransaction.findByIdAndUpdate(transactionId, { orderId });
      return { success: true };
    } catch (error) {
      console.error("Update transaction with order ID error:", error);
      return { success: false, error: "Failed to update transaction" };
    }
  }

  /**
   * Admin function to manually adjust user points
   */
  static async adminAdjustPoints(
    userId: mongoose.Types.ObjectId,
    amount: number,
    note: string,
    adminId: mongoose.Types.ObjectId
  ): Promise<{ success: boolean; transaction?: any; error?: string }> {
    try {
      if (amount === 0) {
        return { success: false, error: "Amount cannot be zero" };
      }

      const type = amount > 0 ? "bank_deposit_transfer_add" : "purchase_reward";
      const adjustedNote = `Admin adjustment by ${adminId}: ${note}`;

      if (amount > 0) {
        return await this.addPoints(userId, amount, type, adjustedNote);
      } else {
        return await this.deductPoints(userId, Math.abs(amount), adjustedNote);
      }
    } catch (error) {
      console.error("Admin adjust points error:", error);
      return { success: false, error: "Failed to adjust points" };
    }
  }
}
