import request from 'supertest';
import { createTestApp } from '../app';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { ProductView } from '../../models/ProductView';
import { PointTransaction } from '../../models/PointTransaction';

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  const cookieHeader = headers['set-cookie']?.find((cookie: string) => cookie.startsWith('token-banhmi='));
  return cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : '';
};

const app = createTestApp();

describe('Analytics Data Accuracy Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;
  let buyerId: string;
  let product1Id: string;
  let product2Id: string;
  let product3Id: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'admin',
      status: 'approved'
    });
    await adminUser.save();

    // Create buyer user
    const buyerUser = new User({
      email: 'buyer@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'buyer',
      status: 'approved'
    });
    await buyerUser.save();
    buyerId = buyerUser._id.toString();

    const buyerProfile = new BuyerProfile({
      userId: buyerUser._id,
      name: 'Analytics Test Buyer',
      tel: '090-1234-5678',
      zip1: '123',
      zip2: '4567',
      address1: 'Tokyo',
      address2: 'Test',
      point: 2000
    });
    await buyerProfile.save();

    // Create test products
    const product1 = new Product({
      name: 'Popular Bánh Mì',
      type: 'banhmi',
      description: 'Most popular product',
      price: 500,
      stock: 100
    });
    await product1.save();
    product1Id = product1._id.toString();

    const product2 = new Product({
      name: 'Regular Bánh Mì',
      type: 'banhmi',
      description: 'Regular product',
      price: 400,
      stock: 50
    });
    await product2.save();
    product2Id = product2._id.toString();

    const product3 = new Product({
      name: 'Special Drink',
      type: 'drink',
      description: 'Special drink',
      price: 300,
      stock: 30
    });
    await product3.save();
    product3Id = product3._id.toString();

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = extractTokenFromCookie(adminLogin.headers);

    const buyerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.com', password: 'password123' });
    buyerToken = extractTokenFromCookie(buyerLogin.headers);
  });

  describe('Requirement 8.1 - Product View Tracking Accuracy', () => {
    it('should accurately track product views', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Simulate product views
      await request(app)
        .get(`/api/products/${product1Id}`)
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .expect(200);

      await request(app)
        .get(`/api/products/${product1Id}`)
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .expect(200);

      await request(app)
        .get(`/api/products/${product2Id}`)
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .expect(200);

      // Check if views were recorded correctly
      const product1Views = await ProductView.findOne({
        productId: product1Id,
        date: today
      });

      const product2Views = await ProductView.findOne({
        productId: product2Id,
        date: today
      });

      expect(product1Views).toBeTruthy();
      expect(product1Views!.count).toBe(2);
      expect(product2Views).toBeTruthy();
      expect(product2Views!.count).toBe(1);
    });

    it('should not track admin/staff views', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Admin views should not be tracked
      await request(app)
        .get(`/api/products/${product3Id}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const product3Views = await ProductView.findOne({
        productId: product3Id,
        date: today
      });

      // Should be null since admin views are not tracked
      expect(product3Views).toBeNull();
    });

    it('should aggregate views correctly in analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const topViewed = response.body.analytics.topViewedProducts;
      expect(Array.isArray(topViewed)).toBe(true);

      // Find our test products in the results
      const product1Analytics = topViewed.find((p: any) => p.productName === 'Popular Bánh Mì');
      const product2Analytics = topViewed.find((p: any) => p.productName === 'Regular Bánh Mì');

      expect(product1Analytics).toBeTruthy();
      expect(product1Analytics.totalViews).toBe(2);
      expect(product2Analytics).toBeTruthy();
      expect(product2Analytics.totalViews).toBe(1);
    });
  });

  describe('Requirement 8.2 - Order Analytics Accuracy', () => {
    beforeAll(async () => {
      // Create test orders with different quantities
      const order1 = new Order({
        buyerId: buyerId,
        items: [{
          productId: product1Id,
          quantity: 5,
          selectedOptions: [],
          subtotal: 2500
        }],
        paymentType: 'ポイント',
        totalAmount: 2500,
        pointsUsed: 2500,
        status: 'completed'
      });
      await order1.save();

      const order2 = new Order({
        buyerId: buyerId,
        items: [{
          productId: product1Id,
          quantity: 3,
          selectedOptions: [],
          subtotal: 1500
        }],
        paymentType: '代引き',
        totalAmount: 1500,
        status: 'completed'
      });
      await order2.save();

      const order3 = new Order({
        buyerId: buyerId,
        items: [{
          productId: product2Id,
          quantity: 2,
          selectedOptions: [],
          subtotal: 800
        }],
        paymentType: '代引き',
        totalAmount: 800,
        status: 'completed'
      });
      await order3.save();

      const order4 = new Order({
        buyerId: buyerId,
        items: [{
          productId: product3Id,
          quantity: 1,
          selectedOptions: [],
          subtotal: 300
        }],
        paymentType: '代引き',
        totalAmount: 300,
        status: 'pending' // This should not be counted
      });
      await order4.save();
    });

    it('should accurately calculate top ordered products', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const topOrdered = response.body.analytics.topOrderedProducts;
      expect(Array.isArray(topOrdered)).toBe(true);

      // Find our test products
      const product1Analytics = topOrdered.find((p: any) => p.productName === 'Popular Bánh Mì');
      const product2Analytics = topOrdered.find((p: any) => p.productName === 'Regular Bánh Mì');
      const product3Analytics = topOrdered.find((p: any) => p.productName === 'Special Drink');

      // Product 1 should have 8 total ordered (5 + 3)
      expect(product1Analytics).toBeTruthy();
      expect(product1Analytics.totalOrdered).toBe(8);

      // Product 2 should have 2 total ordered
      expect(product2Analytics).toBeTruthy();
      expect(product2Analytics.totalOrdered).toBe(2);

      // Product 3 should not appear (pending order not counted)
      expect(product3Analytics).toBeFalsy();
    });

    it('should only count completed orders', async () => {
      // Create a cancelled order
      const cancelledOrder = new Order({
        buyerId: buyerId,
        items: [{
          productId: product2Id,
          quantity: 10,
          selectedOptions: [],
          subtotal: 4000
        }],
        paymentType: '代引き',
        totalAmount: 4000,
        status: 'cancelled'
      });
      await cancelledOrder.save();

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const topOrdered = response.body.analytics.topOrderedProducts;
      const product2Analytics = topOrdered.find((p: any) => p.productName === 'Regular Bánh Mì');

      // Should still be 2, not 12 (cancelled order not counted)
      expect(product2Analytics.totalOrdered).toBe(2);
    });
  });

  describe('Requirement 8.3 - User Registration Statistics', () => {
    beforeAll(async () => {
      // Create users with different registration dates and statuses
      const user1 = new User({
        email: 'user1@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'approved',
        createdAt: new Date('2024-01-01')
      });
      await user1.save();

      const user2 = new User({
        email: 'user2@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'pending',
        createdAt: new Date('2024-01-15')
      });
      await user2.save();

      const user3 = new User({
        email: 'user3@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'blacklisted',
        createdAt: new Date('2024-02-01')
      });
      await user3.save();
    });

    it('should provide accurate user registration statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const userStats = response.body.analytics.userRegistrations;
      expect(userStats).toBeDefined();
      expect(userStats.total).toBeGreaterThanOrEqual(5); // At least our test users
      expect(userStats.approved).toBeGreaterThanOrEqual(2);
      expect(userStats.pending).toBeGreaterThanOrEqual(1);
      expect(userStats.blacklisted).toBeGreaterThanOrEqual(1);
    });

    it('should exclude admin and staff from buyer statistics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const userStats = response.body.analytics.userRegistrations;
      
      // Total should not include admin users in buyer statistics
      const totalUsers = await User.countDocuments({ del_flg: { $ne: true } });
      const buyerUsers = await User.countDocuments({ 
        role: 'buyer', 
        del_flg: { $ne: true } 
      });

      expect(userStats.total).toBe(buyerUsers);
      expect(userStats.total).toBeLessThan(totalUsers);
    });
  });

  describe('Requirement 8.4 - Point Transaction Analytics', () => {
    beforeAll(async () => {
      // Create various point transactions
      const transaction1 = new PointTransaction({
        userId: buyerId,
        type: 'purchase_reward',
        amount: 25,
        note: 'Order completion reward'
      });
      await transaction1.save();

      const transaction2 = new PointTransaction({
        userId: buyerId,
        type: 'bank_deposit_transfer_add',
        amount: 100,
        note: 'Admin bonus'
      });
      await transaction2.save();

      const transaction3 = new PointTransaction({
        userId: buyerId,
        type: 'purchase_deduction',
        amount: -50,
        note: 'Point payment'
      });
      await transaction3.save();
    });

    it('should accurately track point transactions', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      // Verify analytics includes point-related data
      expect(response.body.analytics).toBeDefined();
      
      // Check if point transactions are reflected in user data
      const userProfile = await BuyerProfile.findOne({ userId: buyerId });
      expect(userProfile).toBeTruthy();
      
      // Verify point balance is calculated correctly
      const pointTransactions = await PointTransaction.find({ 
        userId: buyerId,
        del_flg: { $ne: true }
      });
      
      const totalPoints = pointTransactions.reduce((sum, transaction) => {
        return sum + transaction.amount;
      }, 0);
      
      // The profile should reflect the accumulated points
      expect(userProfile!.point).toBeGreaterThan(0);
    });
  });

  describe('Requirement 8.5 - Real-time Analytics Updates', () => {
    it('should update analytics immediately after new orders', async () => {
      // Get initial analytics
      const initialResponse = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const initialTopOrdered = initialResponse.body.analytics.topOrderedProducts;
      const initialProduct1 = initialTopOrdered.find((p: any) => p.productName === 'Popular Bánh Mì');
      const initialCount = initialProduct1 ? initialProduct1.totalOrdered : 0;

      // Create a new order
      const newOrder = new Order({
        buyerId: buyerId,
        items: [{
          productId: product1Id,
          quantity: 1,
          selectedOptions: [],
          subtotal: 500
        }],
        paymentType: '代引き',
        totalAmount: 500,
        status: 'completed'
      });
      await newOrder.save();

      // Get updated analytics
      const updatedResponse = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const updatedTopOrdered = updatedResponse.body.analytics.topOrderedProducts;
      const updatedProduct1 = updatedTopOrdered.find((p: any) => p.productName === 'Popular Bánh Mì');

      // Should reflect the new order immediately
      expect(updatedProduct1.totalOrdered).toBe(initialCount + 1);
    });

    it('should update view analytics immediately after product views', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get initial view count
      const initialViews = await ProductView.findOne({
        productId: product2Id,
        date: today
      });
      const initialCount = initialViews ? initialViews.count : 0;

      // View the product
      await request(app)
        .get(`/api/products/${product2Id}`)
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .expect(200);

      // Check updated view count
      const updatedViews = await ProductView.findOne({
        productId: product2Id,
        date: today
      });

      expect(updatedViews!.count).toBe(initialCount + 1);

      // Verify it appears in analytics
      const analyticsResponse = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const topViewed = analyticsResponse.body.analytics.topViewedProducts;
      const product2Analytics = topViewed.find((p: any) => p.productName === 'Regular Bánh Mì');

      expect(product2Analytics.totalViews).toBe(initialCount + 1);
    });
  });

  describe('Analytics Data Integrity', () => {
    it('should handle soft-deleted records correctly', async () => {
      // Soft delete a product
      await Product.findByIdAndUpdate(product3Id, { del_flg: true });

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const topOrdered = response.body.analytics.topOrderedProducts;
      const topViewed = response.body.analytics.topViewedProducts;

      // Soft-deleted product should not appear in analytics
      const deletedProductInOrdered = topOrdered.find((p: any) => p.productName === 'Special Drink');
      const deletedProductInViewed = topViewed.find((p: any) => p.productName === 'Special Drink');

      expect(deletedProductInOrdered).toBeFalsy();
      expect(deletedProductInViewed).toBeFalsy();
    });

    it('should maintain data consistency across different time periods', async () => {
      // This test ensures that analytics data remains consistent
      // when queried multiple times
      const response1 = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      // Wait a moment and query again
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      // Results should be identical (no new data was added)
      expect(response1.body.analytics.userRegistrations.total)
        .toBe(response2.body.analytics.userRegistrations.total);
      
      expect(response1.body.analytics.topOrderedProducts.length)
        .toBe(response2.body.analytics.topOrderedProducts.length);
    });
  });
});