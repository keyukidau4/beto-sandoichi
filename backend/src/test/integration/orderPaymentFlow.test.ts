import request from 'supertest';
import { createTestApp } from '../app';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { PointTransaction } from '../../models/PointTransaction';

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  const cookieHeader = headers['set-cookie']?.find((cookie: string) => cookie.startsWith('token-banhmi='));
  return cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : '';
};

const app = createTestApp();

describe('Order Placement and Payment Flow Integration Tests', () => {
  let pendingBuyerToken: string;
  let approvedBuyerToken: string;
  let adminToken: string;
  let productId: string;
  let approvedBuyerId: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'admin',
      status: 'approved'
    });
    await adminUser.save();

    // Create pending buyer
    const pendingBuyer = new User({
      email: 'pending@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'buyer',
      status: 'pending'
    });
    await pendingBuyer.save();

    const pendingProfile = new BuyerProfile({
      userId: pendingBuyer._id,
      name: 'Pending Buyer',
      tel: '090-1111-1111',
      zip1: '123',
      zip2: '4567',
      address1: 'Tokyo',
      address2: 'Test',
      point: 0
    });
    await pendingProfile.save();

    // Create approved buyer
    const approvedBuyer = new User({
      email: 'approved@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'buyer',
      status: 'approved'
    });
    await approvedBuyer.save();
    approvedBuyerId = approvedBuyer._id.toString();

    const approvedProfile = new BuyerProfile({
      userId: approvedBuyer._id,
      name: 'Approved Buyer',
      tel: '090-2222-2222',
      zip1: '987',
      zip2: '6543',
      address1: 'Osaka',
      address2: 'Test',
      point: 1000 // Give some points for testing
    });
    await approvedProfile.save();

    // Create test product
    const product = new Product({
      name: 'Test Bánh Mì',
      type: 'banhmi',
      description: 'Test bánh mì for integration testing',
      price: 500,
      stock: 10,
      options: [
        { name: 'パクチー', extraCost: 50 },
        { name: 'チリソース', extraCost: 0 }
      ]
    });
    await product.save();
    productId = product._id.toString();

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = extractTokenFromCookie(adminLogin.headers);

    const pendingLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@test.com', password: 'password123' });
    pendingBuyerToken = extractTokenFromCookie(pendingLogin.headers);

    const approvedLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'approved@test.com', password: 'password123' });
    approvedBuyerToken = extractTokenFromCookie(approvedLogin.headers);
  });

  describe('Requirement 3.1 - Shopping Cart Functionality', () => {
    it('should calculate subtotal correctly with options', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2,
            selectedOptions: ['パクチー', 'チリソース']
          }
        ],
        paymentType: '代引き'
      };

      // Calculate expected total: (500 + 50 + 0) * 2 = 1100
      const expectedTotal = 1100;

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order.totalAmount).toBe(expectedTotal);
      expect(response.body.order.items[0].subtotal).toBe(550); // (500 + 50) per item
    });
  });

  describe('Requirement 3.2 & 3.3 - Product Options', () => {
    it('should add パクチー cost correctly', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 1,
            selectedOptions: ['パクチー']
          }
        ],
        paymentType: '代引き'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order.totalAmount).toBe(550); // 500 + 50
    });

    it('should not charge for チリソース', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 1,
            selectedOptions: ['チリソース']
          }
        ],
        paymentType: '代引き'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order.totalAmount).toBe(500); // No extra cost
    });
  });

  describe('Requirement 4.1 - Payment Method Restrictions', () => {
    it('should only show COD option for pending buyers', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 1,
            selectedOptions: []
          }
        ],
        paymentType: 'ポイント'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.message).toContain('Point payment not available');
    });

    it('should allow COD payment for pending buyers', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 1,
            selectedOptions: []
          }
        ],
        paymentType: '代引き'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order.paymentType).toBe('代引き');
    });
  });

  describe('Requirement 4.2 & 4.3 - Point Payment for Approved Buyers', () => {
    it('should allow point payment for approved buyers with sufficient points', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 1,
            selectedOptions: []
          }
        ],
        paymentType: 'ポイント'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order.paymentType).toBe('ポイント');
      expect(response.body.order.pointsUsed).toBe(500);

      // Verify points were deducted
      const profile = await BuyerProfile.findOne({ userId: approvedBuyerId });
      expect(profile!.point).toBe(500); // 1000 - 500
    });

    it('should reject point payment when insufficient points', async () => {
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2, // This would cost 1000 points, but user only has 500 left
            selectedOptions: []
          }
        ],
        paymentType: 'ポイント'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.message).toContain('Insufficient points');
    });
  });

  describe('Requirement 3.4 & 3.5 - Stock Management', () => {
    it('should check stock availability before creating order', async () => {
      // Create a product with limited stock
      const limitedProduct = new Product({
        name: 'Limited Bánh Mì',
        type: 'banhmi',
        description: 'Limited stock product',
        price: 300,
        stock: 1,
        options: []
      });
      await limitedProduct.save();

      const orderData = {
        items: [
          {
            productId: limitedProduct._id.toString(),
            quantity: 2 // More than available stock
          }
        ],
        paymentType: '代引き'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should deduct stock when order is created', async () => {
      const initialStock = await Product.findById(productId);
      const initialStockCount = initialStock!.stock;

      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 2
          }
        ],
        paymentType: '代引き'
      };

      await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`)
        .send(orderData)
        .expect(201);

      const updatedProduct = await Product.findById(productId);
      expect(updatedProduct!.stock).toBe(initialStockCount - 2);
    });
  });

  describe('Requirement 5.1 & 5.2 - Point Earning System', () => {
    it('should award points after COD order completion', async () => {
      // First, create an order
      const orderData = {
        items: [
          {
            productId: productId,
            quantity: 1
          }
        ],
        paymentType: '代引き'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .send(orderData);

      const orderId = orderResponse.body.order._id;

      // Simulate order completion by admin
      await request(app)
        .put(`/api/admin/orders/${orderId}/status`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({ status: 'completed' })
        .expect(200);

      // Check if points were awarded (500 yen = 5 points)
      const pointTransaction = await PointTransaction.findOne({
        userId: approvedBuyerId,
        orderId: orderId,
        type: 'purchase_reward'
      });

      expect(pointTransaction).toBeTruthy();
      expect(pointTransaction!.amount).toBe(5); // 500 / 100 = 5 points
    });
  });

  describe('Requirement 4.4 & 4.5 - Order History and Details', () => {
    it('should allow buyer to view their order history', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should allow buyer to view specific order details', async () => {
      // Get the first order from history
      const historyResponse = await request(app)
        .get('/api/orders')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`);

      const orderId = historyResponse.body.orders[0]._id;

      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .expect(200);

      expect(response.body.order).toBeDefined();
      expect(response.body.order._id).toBe(orderId);
      expect(response.body.order.items).toBeDefined();
    });

    it('should prevent buyer from viewing other users orders', async () => {
      // Get an order from the pending buyer
      const pendingOrderResponse = await request(app)
        .get('/api/orders')
        .set('Cookie', `token-banhmi=${pendingBuyerToken}`);

      if (pendingOrderResponse.body.orders.length > 0) {
        const pendingOrderId = pendingOrderResponse.body.orders[0]._id;

        // Try to access it with approved buyer token
        const response = await request(app)
          .get(`/api/orders/${pendingOrderId}`)
          .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
          .expect(404);

        expect(response.body.message).toContain('Order not found');
      }
    });
  });
});