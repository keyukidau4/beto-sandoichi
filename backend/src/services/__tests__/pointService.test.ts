import mongoose from 'mongoose';
import { PointService } from '../pointService';
import { BuyerProfile } from '../../models/BuyerProfile';
import { PointTransaction } from '../../models/PointTransaction';
import { Order } from '../../models/Order';
import { User } from '../../models/User';

describe('PointService', () => {
  let userId: mongoose.Types.ObjectId;
  let buyerProfileId: mongoose.Types.ObjectId;
  let orderId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'buyer',
      status: 'approved'
    });
    userId = user._id;

    // Create buyer profile
    const buyerProfile = await BuyerProfile.create({
      userId,
      name: 'Test User',
      tel: '123-456-7890',
      zip1: '123',
      zip2: '4567',
      address1: 'Test Address 1',
      address2: 'Test Address 2',
      point: 1000
    });
    buyerProfileId = buyerProfile._id;

    // Create test order
    const order = await Order.create({
      buyerId: userId,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        quantity: 1,
        selectedOptions: [],
        subtotal: 500
      }],
      paymentType: '代引き',
      totalAmount: 500,
      status: 'pending'
    });
    orderId = order._id;
  });

  describe('calculatePointsEarned', () => {
    it('should calculate points correctly (100円 = 1 point)', () => {
      expect(PointService.calculatePointsEarned(100)).toBe(1);
      expect(PointService.calculatePointsEarned(500)).toBe(5);
      expect(PointService.calculatePointsEarned(550)).toBe(5); // Floor division
      expect(PointService.calculatePointsEarned(99)).toBe(0);
      expect(PointService.calculatePointsEarned(0)).toBe(0);
    });

    it('should handle large amounts', () => {
      expect(PointService.calculatePointsEarned(10000)).toBe(100);
      expect(PointService.calculatePointsEarned(99999)).toBe(999);
    });
  });

  describe('validatePointsForPayment', () => {
    it('should validate sufficient points', async () => {
      const result = await PointService.validatePointsForPayment(userId, 500);
      
      expect(result.isValid).toBe(true);
      expect(result.availablePoints).toBe(1000);
      expect(result.requiredPoints).toBe(500);
      expect(result.message).toBeUndefined();
    });

    it('should validate insufficient points', async () => {
      const result = await PointService.validatePointsForPayment(userId, 1500);
      
      expect(result.isValid).toBe(false);
      expect(result.availablePoints).toBe(1000);
      expect(result.requiredPoints).toBe(1500);
      expect(result.message).toContain('Insufficient points');
    });

    it('should handle non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const result = await PointService.validatePointsForPayment(nonExistentUserId, 100);
      
      expect(result.isValid).toBe(false);
      expect(result.availablePoints).toBe(0);
      expect(result.message).toBe('Buyer profile not found');
    });
  });

  describe('addPoints', () => {
    it('should add points successfully', async () => {
      const result = await PointService.addPoints(
        userId,
        500,
        'purchase_reward',
        'Test reward',
        orderId
      );

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.error).toBeUndefined();

      // Verify buyer profile updated
      const updatedProfile = await BuyerProfile.findOne({ userId });
      expect(updatedProfile?.point).toBe(1500); // 1000 + 500

      // Verify transaction created
      const transaction = await PointTransaction.findById(result.transaction._id);
      expect(transaction?.amount).toBe(500);
      expect(transaction?.type).toBe('purchase_reward');
      expect(transaction?.note).toBe('Test reward');
      expect(transaction?.orderId?.toString()).toBe(orderId.toString());
    });

    it('should reject negative amounts', async () => {
      const result = await PointService.addPoints(
        userId,
        -100,
        'purchase_reward',
        'Invalid amount'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount must be positive');
    });

    it('should handle non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const result = await PointService.addPoints(
        nonExistentUserId,
        100,
        'purchase_reward',
        'Test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Buyer profile not found');
    });
  });

  describe('deductPoints', () => {
    it('should deduct points successfully', async () => {
      const result = await PointService.deductPoints(
        userId,
        300,
        'Purchase payment',
        orderId
      );

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();

      // Verify buyer profile updated
      const updatedProfile = await BuyerProfile.findOne({ userId });
      expect(updatedProfile?.point).toBe(700); // 1000 - 300

      // Verify transaction created with negative amount
      const transaction = await PointTransaction.findById(result.transaction._id);
      expect(transaction?.amount).toBe(-300);
      expect(transaction?.type).toBe('purchase_deduction');
    });

    it('should reject insufficient points', async () => {
      const result = await PointService.deductPoints(
        userId,
        1500,
        'Insufficient payment'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient points');

      // Verify no changes to buyer profile
      const profile = await BuyerProfile.findOne({ userId });
      expect(profile?.point).toBe(1000);
    });

    it('should reject negative amounts', async () => {
      const result = await PointService.deductPoints(
        userId,
        -100,
        'Invalid amount'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount must be positive');
    });
  });

  describe('getPointHistory', () => {
    beforeEach(async () => {
      // Create some test transactions
      await PointTransaction.create([
        {
          userId,
          type: 'purchase_reward',
          amount: 100,
          note: 'First transaction',
          createdAt: new Date('2024-01-01')
        },
        {
          userId,
          type: 'purchase_deduction',
          amount: -50,
          note: 'Second transaction',
          createdAt: new Date('2024-01-02')
        },
        {
          userId,
          type: 'bank_deposit_transfer_add',
          amount: 200,
          note: 'Third transaction',
          createdAt: new Date('2024-01-03')
        }
      ]);
    });

    it('should return paginated transaction history', async () => {
      const result = await PointService.getPointHistory(userId, 1, 2);

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalTransactions).toBe(3);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(false);

      // Should be sorted by newest first
      expect(result.transactions[0].note).toBe('Third transaction');
      expect(result.transactions[1].note).toBe('Second transaction');
    });

    it('should handle empty history', async () => {
      const newUserId = new mongoose.Types.ObjectId();
      const result = await PointService.getPointHistory(newUserId);

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.totalTransactions).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('getPointBalance', () => {
    it('should return current point balance', async () => {
      const balance = await PointService.getPointBalance(userId);
      expect(balance).toBe(1000);
    });

    it('should return 0 for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const balance = await PointService.getPointBalance(nonExistentUserId);
      expect(balance).toBe(0);
    });
  });

  describe('processOrderReward', () => {
    it('should process COD order reward successfully', async () => {
      const result = await PointService.processOrderReward(orderId);

      expect(result.success).toBe(true);
      expect(result.pointsEarned).toBe(5); // 500 / 100 = 5 points

      // Verify order updated
      const updatedOrder = await Order.findById(orderId);
      expect(updatedOrder?.pointsEarned).toBe(5);

      // Verify buyer profile updated
      const updatedProfile = await BuyerProfile.findOne({ userId });
      expect(updatedProfile?.point).toBe(1005); // 1000 + 5

      // Verify transaction created
      const transaction = await PointTransaction.findOne({
        orderId,
        type: 'purchase_reward'
      });
      expect(transaction).toBeDefined();
      expect(transaction?.amount).toBe(5);
    });

    it('should reject point payment orders', async () => {
      // Update order to point payment
      await Order.findByIdAndUpdate(orderId, { paymentType: 'ポイント' });

      const result = await PointService.processOrderReward(orderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Point rewards only for COD orders');
    });

    it('should prevent duplicate rewards', async () => {
      // Process reward first time
      await PointService.processOrderReward(orderId);

      // Try to process again
      const result = await PointService.processOrderReward(orderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Points already earned for this order');
    });

    it('should handle non-existent order', async () => {
      const nonExistentOrderId = new mongoose.Types.ObjectId();
      const result = await PointService.processOrderReward(nonExistentOrderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('adminAdjustPoints', () => {
    const adminId = new mongoose.Types.ObjectId();

    it('should add points via admin adjustment', async () => {
      const result = await PointService.adminAdjustPoints(
        userId,
        500,
        'Manual adjustment',
        adminId
      );

      expect(result.success).toBe(true);

      // Verify buyer profile updated
      const updatedProfile = await BuyerProfile.findOne({ userId });
      expect(updatedProfile?.point).toBe(1500);

      // Verify transaction note includes admin info
      const transaction = await PointTransaction.findById(result.transaction._id);
      expect(transaction?.note).toContain(`Admin adjustment by ${adminId}`);
    });

    it('should deduct points via admin adjustment', async () => {
      const result = await PointService.adminAdjustPoints(
        userId,
        -200,
        'Manual deduction',
        adminId
      );

      expect(result.success).toBe(true);

      // Verify buyer profile updated
      const updatedProfile = await BuyerProfile.findOne({ userId });
      expect(updatedProfile?.point).toBe(800);
    });

    it('should reject zero amount', async () => {
      const result = await PointService.adminAdjustPoints(
        userId,
        0,
        'Zero adjustment',
        adminId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount cannot be zero');
    });
  });
});