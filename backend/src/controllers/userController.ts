import { Request, Response } from 'express';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { ContactRequest } from '../models/ContactRequest';
import { PointTransaction } from '../models/PointTransaction';
import { emailService } from '../services/emailService';

// Get all users (Admin only)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ del_flg: false })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get buyer profiles for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'buyer') {
          const buyerProfile = await BuyerProfile.findOne({ userId: user._id });
          return {
            ...user.toObject(),
            buyerProfile
          };
        }
        return user.toObject();
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithProfiles
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザー一覧の取得に失敗しました'
    });
  }
};

// Send automated approval email using new automated email system
const sendAutomatedApprovalEmail = async (userEmail: string, userName: string, userPoint: number) => {
  try {
    await emailService.sendAutomatedEmail('approval', userEmail, {
      name: userName,
      email: userEmail,
      point: userPoint,
      currentDate: new Date().toLocaleDateString('ja-JP'),
      systemName: 'BanhMi App'
    });
    console.log(`Automated approval email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send automated approval email:', error);
    // Don't throw error - email failure shouldn't block status update
  }
};

// Update user status (Admin only)
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'blacklisted'].includes(status)) {
      res.status(400).json({
        success: false,
        message: '無効なステータスです'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
      return;
    }

    const adminId = req.user?._id?.toString();
    emailService.adminId = adminId;

    // Send automated approval email if status changed to approved
    if (status === 'approved' && user.role === 'buyer') {
      const buyerProfile = await BuyerProfile.findOne({ userId });
      if (buyerProfile) {
        await sendAutomatedApprovalEmail(user.email, buyerProfile.name, buyerProfile.point);
      }
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'ユーザーステータスを更新しました'
    });
    return;
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザーステータスの更新に失敗しました'
    });
    return;
  }
};

// Bulk update user status (Admin only)
export const bulkUpdateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userIds, status } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ユーザーIDの配列が必要です'
      });
      return;
    }

    if (!['pending', 'approved', 'blacklisted'].includes(status)) {
      res.status(400).json({
        success: false,
        message: '無効なステータスです'
      });
      return;
    }

    // Update all users
    const updateResult = await User.updateMany(
      { _id: { $in: userIds } },
      { status },
      { runValidators: true }
    );

    // Send approval emails if status is approved
    if (status === 'approved') {
      const users = await User.find({ 
        _id: { $in: userIds }, 
        role: 'buyer' 
      }).select('email');
      
      for (const user of users) {
        const buyerProfile = await BuyerProfile.findOne({ userId: user._id });
        if (buyerProfile) {
          await sendAutomatedApprovalEmail(user.email, buyerProfile.name, buyerProfile.point);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount
      },
      message: `${updateResult.modifiedCount}人のユーザーステータスを更新しました`
    });
    return;
  } catch (error) {
    console.error('Bulk update user status error:', error);
    res.status(500).json({
      success: false,
      message: '一括ステータス更新に失敗しました'
    });
    return;
  }
};

// Get user statistics (Admin only)
export const getUserStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await User.aggregate([
      {
        $match: { del_flg: false }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $match: { del_flg: false }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments({ del_flg: false });

    const formattedStats = {
      total: totalUsers,
      byStatus: {
        pending: 0,
        approved: 0,
        blacklisted: 0
      },
      byRole: {
        admin: 0,
        staff: 0,
        buyer: 0
      }
    };

    stats.forEach(stat => {
      formattedStats.byStatus[stat._id as keyof typeof formattedStats.byStatus] = stat.count;
    });

    roleStats.forEach(stat => {
      formattedStats.byRole[stat._id as keyof typeof formattedStats.byRole] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });
    return;
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'ユーザー統計の取得に失敗しました'
    });
    return;
  }
};

// Update user points (Admin only)
export const updateUserPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { points, note } = req.body;

    if (typeof points !== 'number' || points < 0) {
      res.status(400).json({
        success: false,
        message: '無効なポイント数です'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'buyer') {
      res.status(404).json({
        success: false,
        message: 'バイヤーユーザーが見つかりません'
      });
      return;
    }

    const buyerProfile = await BuyerProfile.findOne({ userId });
    if (!buyerProfile) {
      res.status(404).json({
        success: false,
        message: 'バイヤープロフィールが見つかりません'
      });
      return;
    }

    const oldPoints = buyerProfile.point;
    const pointDifference = points - oldPoints;
    const newPoint = points + oldPoints

    // Update buyer profile points
    buyerProfile.point = newPoint;
    await buyerProfile.save();

    // Create point transaction record
    await PointTransaction.create({
      userId,
      type: 'bank_deposit_transfer_add',
      amount: pointDifference,
      note: note || `管理者によるポイント調整: ${oldPoints} → ${newPoint}`
    });

    const adminId = req.user?._id?.toString();
    emailService.adminId = adminId;

    // Send automated point notification email for significant changes
    if (Math.abs(pointDifference) >= 100) { // Only send email for 100+ point changes
      try {
        await emailService.sendAutomatedEmail('point_notification', user.email, {
          name: buyerProfile.name,
          email: user.email,
          point: newPoint,
          currentDate: new Date().toLocaleDateString('ja-JP'),
          systemName: 'BanhMi App'
        });
      } catch (emailError) {
        console.error('Failed to send point notification email:', emailError);
        // Don't fail the point update if email fails
      }
    }

    res.status(200).json({
      success: true,
      data: buyerProfile,
      message: 'ポイントを更新しました'
    });
    return;
  } catch (error) {
    console.error('Update user points error:', error);
    res.status(500).json({
      success: false,
      message: 'ポイントの更新に失敗しました'
    });
    return;
  }
};

// Create contact request
export const createContactRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, content } = req.body;
    const userId = req.user!._id;

    if (!type || !content) {
      res.status(400).json({
        success: false,
        message: 'お問い合わせ種別と内容は必須です'
      });
      return;
    }

    if (!['update-info', 'general-inquiry', 'complaint'].includes(type)) {
      res.status(400).json({
        success: false,
        message: '無効なお問い合わせ種別です'
      });
      return;
    }

    const contactRequest = await ContactRequest.create({
      buyerId: userId,
      type,
      content: content.trim()
    });

    res.status(201).json({
      success: true,
      data: contactRequest,
      message: 'お問い合わせを送信しました'
    });
    return;
  } catch (error) {
    console.error('Create contact request error:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせの送信に失敗しました'
    });
    return;
  }
};

// Get user's contact requests
export const getUserContactRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const contactRequests = await ContactRequest.find({ buyerId: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contactRequests
    });
    return;
  } catch (error) {
    console.error('Get user contact requests error:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせ履歴の取得に失敗しました'
    });
    return;
  }
};

// Get all contact requests (Admin only)
export const getContactRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const contactRequests = await ContactRequest.find()
      .populate('buyerId', 'email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contactRequests
    });
    return;
  } catch (error) {
    console.error('Get contact requests error:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせ一覧の取得に失敗しました'
    });
    return;
  }
};

// Update contact request (Admin only)
export const updateContactRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminResponse, status } = req.body;

    if (!adminResponse || !status) {
      res.status(400).json({
        success: false,
        message: '管理者回答とステータスは必須です'
      });
      return;
    }

    if (!['pending', 'done'].includes(status)) {
      res.status(400).json({
        success: false,
        message: '無効なステータスです'
      });
      return;
    }

    const contactRequest = await ContactRequest.findByIdAndUpdate(
      id,
      { 
        adminResponse: adminResponse.trim(),
        status 
      },
      { new: true, runValidators: true }
    ).populate('buyerId', 'email');

    if (!contactRequest) {
      res.status(404).json({
        success: false,
        message: 'お問い合わせが見つかりません'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: contactRequest,
      message: 'お問い合わせを更新しました'
    });
    return;
  } catch (error) {
    console.error('Update contact request error:', error);
    res.status(500).json({
      success: false,
      message: 'お問い合わせの更新に失敗しました'
    });
    return;
  }
};