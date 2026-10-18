import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PointService } from '../services/pointService';
import { BuyerProfile } from '../models/BuyerProfile';
import { User } from '../models/User';
// Import all models to ensure they're registered
import '../models';

// Get user's point balance and recent transactions
export const getPointBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    
    // Get current point balance
    const balance = await PointService.getPointBalance(userId);
    
    // Get recent transactions (last 5)
    const historyResult = await PointService.getPointHistory(userId, 1, 5);
    
    return res.json({
      balance,
      recentTransactions: historyResult.transactions
    });
  } catch (error) {
    console.error('Get point balance error:', error);
    return res.status(500).json({
      message: 'Failed to fetch point balance',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get user's complete point transaction history
export const getPointHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await PointService.getPointHistory(userId, page, limit);
    
    return res.json(result);
  } catch (error) {
    console.error('Get point history error:', error);
    return res.status(500).json({
      message: 'Failed to fetch point history',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Validate points for payment (used before order creation)
export const validatePointsForPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Valid amount is required'
      });
    }
    
    const validation = await PointService.validatePointsForPayment(
      userId, 
      amount
    );
    
    return res.json(validation);
  } catch (error) {
    console.error('Validate points error:', error);
    return res.status(500).json({
      message: 'Failed to validate points',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Admin: Get all users' point balances
export const getAllUserPoints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Get buyer profiles without population first
    const profiles = await BuyerProfile.find()
      .sort({ point: -1 })
      .skip(skip)
      .limit(limit);
    
    // Manually get user information for each profile
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await User.findById(profile.userId).select('email status role');
        return {
          _id: profile._id,
          userId: user ? {
            _id: user._id,
            email: user.email,
            status: user.status,
            role: user.role
          } : null,
          name: profile.name,
          tel: profile.tel,
          zip1: profile.zip1,
          zip2: profile.zip2,
          address1: profile.address1,
          address2: profile.address2,
          point: profile.point,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        };
      })
    );
    
    // Get total count for pagination
    const totalProfiles = await BuyerProfile.countDocuments();
    const totalPages = Math.ceil(totalProfiles / limit);
    
    return res.json({
      profiles: profilesWithUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalProfiles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get all user points error:', error);
    return res.status(500).json({
      message: 'Failed to fetch user points',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Admin: Adjust user points manually
export const adminAdjustPoints = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, note } = req.body;
    const adminId = req.user!._id;
    
    // Validate input
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format'
      });
    }
    
    if (!amount || amount === 0) {
      return res.status(400).json({
        message: 'Valid amount is required (cannot be zero)'
      });
    }
    
    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        message: 'Note is required for point adjustments'
      });
    }
    
    // Check if user exists and is a buyer
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    if (user.role !== 'buyer') {
      return res.status(400).json({
        message: 'Points can only be adjusted for buyers'
      });
    }
    
    // Adjust points
    const result = await PointService.adminAdjustPoints(
      new mongoose.Types.ObjectId(userId),
      amount,
      note.trim(),
      adminId
    );
    
    if (!result.success) {
      return res.status(400).json({
        message: result.error
      });
    }
    
    // Get updated balance
    const newBalance = await PointService.getPointBalance(
      new mongoose.Types.ObjectId(userId)
    );
    
    return res.json({
      message: 'Points adjusted successfully',
      transaction: result.transaction,
      newBalance
    });
  } catch (error) {
    console.error('Admin adjust points error:', error);
    return res.status(500).json({
      message: 'Failed to adjust points',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Admin: Get user's point transaction history
export const adminGetUserPointHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID format'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    const result = await PointService.getPointHistory(
      new mongoose.Types.ObjectId(userId),
      page,
      limit
    );
    
    // Get current balance
    const currentBalance = await PointService.getPointBalance(
      new mongoose.Types.ObjectId(userId)
    );
    
    return res.json({
      ...result,
      currentBalance,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Admin get user point history error:', error);
    return res.status(500).json({
      message: 'Failed to fetch user point history',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Process order completion for point rewards (used when COD order is marked as paid)
export const processOrderReward = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: 'Invalid order ID format'
      });
    }
    
    const result = await PointService.processOrderReward(
      new mongoose.Types.ObjectId(orderId)
    );
    
    if (!result.success) {
      return res.status(400).json({
        message: result.error
      });
    }
    
    return res.json({
      message: 'Order reward processed successfully',
      pointsEarned: result.pointsEarned
    });
  } catch (error) {
    console.error('Process order reward error:', error);
    return res.status(500).json({
      message: 'Failed to process order reward',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};