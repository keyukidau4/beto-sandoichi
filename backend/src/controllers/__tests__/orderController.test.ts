import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { Product } from '../../models/Product';
import { Order } from '../../models/Order';
import { PointTransaction } from '../../models/PointTransaction';
import { createOrder, getUserOrders, getOrderById } from '../orderController';

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    userId: req.headers['x-user-id'] || 'mock-user-id',
    email: 'test@example.com',
    role: req.headers['x-user-role'] || 'buyer'
  };
  next();
};

app.use(mockAuthMiddleware);
app.post('/orders', createOrder);
app.get('/orders', getUserOrders);
app.get('/orders/:id', getOrderById);

describe('OrderController', () => {
  let testUser: any;
  let testBuyerProfile: any;
  let testProduct: any;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'buyer',
      status: 'approved'
    });

    // Create buyer profile
    testBuyerProfile = await BuyerProfile.create({
      userId: testUser._id,
      name: 'Test User',
      tel: '123-456-7890',
      zip1: '123',
      zip2: '4567',
      address1: 'Test Address 1',
      address2: 'Test Address 2',
      point: 1000
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Banh Mi',
      type: 'banhmi',
      description: 'Test description',
      price: 500,
      stock: 10,
      options: [
        { name: 'パクチー', extraCost: 50 },
        { name: 'チリソース', extraCost: 0 }
      ]
    });
  });

  describe('POST /orders', () => {
    const validOrderData = {
      items: [{
        productId: '',
        quantity: 2,
        selectedOptions: ['パクチー'],
        subtotal: 1100 // (500 + 50) * 2
      }],
      paymentType: '代引き',
      totalAmount: 1100
    };

    beforeEach(() => {
      validOrderData.items[0].productId = testProduct._id.toString();
    });

    it('should create COD order successfully', async () => {
      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(validOrderData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Order created successfully');
      expect(response.body.order).toBeDefined();
      expect(response.body.order.paymentType).toBe('代引き');
      expect(response.body.order.totalAmount).toBe(1100);
      expect(response.body.order.status).toBe('pending');

      // Verify order was created in database
      const order = await Order.findById(response.body.order._id);
      expect(order).toBeDefined();
      expect(order?.buyerId.toString()).toBe(testUser._id.toString());

      // Verify stock was deducted
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct?.stock).toBe(8); // 10 - 2
    });

    it('should create point payment order successfully', async () => {
      const pointOrderData = {
        ...validOrderData,
        paymentType: 'ポイント',
        totalAmount: 1000 // Use 1000 points
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(pointOrderData);

      expect(response.status).toBe(201);
      expect(response.body.order.paymentType).toBe('ポイント');
      expect(response.body.order.pointsUsed).toBe(1000);

      // Verify points were deducted
      const updatedProfile = await BuyerProfile.findOne({ userId: testUser._id });
      expect(updatedProfile?.point).toBe(0); // 1000 - 1000

      // Verify point transaction was created
      const transaction = await PointTransaction.findOne({
        userId: testUser._id,
        type: 'purchase_deduction'
      });
      expect(transaction).toBeDefined();
      expect(transaction?.amount).toBe(-1000);
    });

    it('should reject order with insufficient stock', async () => {
      const insufficientStockOrder = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0],
          quantity: 15 // More than available stock (10)
        }]
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(insufficientStockOrder);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');

      // Verify no stock was deducted
      const product = await Product.findById(testProduct._id);
      expect(product?.stock).toBe(10);
    });

    it('should reject point payment with insufficient points', async () => {
      const insufficientPointsOrder = {
        ...validOrderData,
        paymentType: 'ポイント',
        totalAmount: 1500 // More than available points (1000)
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(insufficientPointsOrder);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient points');

      // Verify no points were deducted
      const profile = await BuyerProfile.findOne({ userId: testUser._id });
      expect(profile?.point).toBe(1000);
    });

    it('should reject order for non-existent product', async () => {
      const invalidProductOrder = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0],
          productId: new mongoose.Types.ObjectId().toString()
        }]
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(invalidProductOrder);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Product not found');
    });

    it('should reject order with invalid payment type', async () => {
      const invalidPaymentOrder = {
        ...validOrderData,
        paymentType: 'invalid-payment'
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(invalidPaymentOrder);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
    });

    it('should calculate subtotal correctly with options', async () => {
      const orderWithOptions = {
        items: [{
          productId: testProduct._id.toString(),
          quantity: 1,
          selectedOptions: ['パクチー', 'チリソース'],
          subtotal: 550 // 500 + 50 + 0
        }],
        paymentType: '代引き',
        totalAmount: 550
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(orderWithOptions);

      expect(response.status).toBe(201);
      expect(response.body.order.items[0].subtotal).toBe(550);
      expect(response.body.order.totalAmount).toBe(550);
    });

    it('should handle multiple items in single order', async () => {
      // Create another product
      const product2 = await Product.create({
        name: 'Test Drink',
        type: 'drink',
        description: 'Test drink',
        price: 300,
        stock: 5,
        options: []
      });

      const multiItemOrder = {
        items: [
          {
            productId: testProduct._id.toString(),
            quantity: 1,
            selectedOptions: ['パクチー'],
            subtotal: 550
          },
          {
            productId: product2._id.toString(),
            quantity: 2,
            selectedOptions: [],
            subtotal: 600
          }
        ],
        paymentType: '代引き',
        totalAmount: 1150
      };

      const response = await request(app)
        .post('/orders')
        .set('x-user-id', testUser._id.toString())
        .send(multiItemOrder);

      expect(response.status).toBe(201);
      expect(response.body.order.items).toHaveLength(2);
      expect(response.body.order.totalAmount).toBe(1150);

      // Verify stock deducted for both products
      const updatedProduct1 = await Product.findById(testProduct._id);
      const updatedProduct2 = await Product.findById(product2._id);
      expect(updatedProduct1?.stock).toBe(9); // 10 - 1
      expect(updatedProduct2?.stock).toBe(3); // 5 - 2
    });
  });

  describe('GET /orders', () => {
    let testOrders: any[];

    beforeEach(async () => {
      // Create test orders
      testOrders = await Order.create([
        {
          buyerId: testUser._id,
          items: [{
            productId: testProduct._id,
            quantity: 1,
            selectedOptions: [],
            subtotal: 500
          }],
          paymentType: '代引き',
          totalAmount: 500,
          status: 'pending',
          createdAt: new Date('2024-01-01')
        },
        {
          buyerId: testUser._id,
          items: [{
            productId: testProduct._id,
            quantity: 2,
            selectedOptions: ['パクチー'],
            subtotal: 1100
          }],
          paymentType: 'ポイント',
          totalAmount: 1100,
          pointsUsed: 1100,
          status: 'paid',
          createdAt: new Date('2024-01-02')
        }
      ]);
    });

    it('should return user orders with pagination', async () => {
      const response = await request(app)
        .get('/orders?page=1&limit=10')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalOrders).toBe(2);

      // Should be sorted by newest first
      expect(new Date(response.body.orders[0].createdAt).getTime())
        .toBeGreaterThan(new Date(response.body.orders[1].createdAt).getTime());
    });

    it('should return empty array for user with no orders', async () => {
      const newUser = await User.create({
        email: 'newuser@example.com',
        password: 'hashedpassword',
        role: 'buyer',
        status: 'approved'
      });

      const response = await request(app)
        .get('/orders')
        .set('x-user-id', newUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(0);
      expect(response.body.pagination.totalOrders).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/orders?page=1&limit=1')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });
  });

  describe('GET /orders/:id', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await Order.create({
        buyerId: testUser._id,
        items: [{
          productId: testProduct._id,
          quantity: 1,
          selectedOptions: ['パクチー'],
          subtotal: 550
        }],
        paymentType: '代引き',
        totalAmount: 550,
        status: 'pending'
      });
    });

    it('should return order details for valid order', async () => {
      const response = await request(app)
        .get(`/orders/${testOrder._id}`)
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order._id).toBe(testOrder._id.toString());
      expect(response.body.order.totalAmount).toBe(550);
      expect(response.body.order.items[0].product).toBeDefined(); // Should be populated
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/orders/${nonExistentId}`)
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Order not found');
    });

    it('should return 403 for order belonging to different user', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'hashedpassword',
        role: 'buyer',
        status: 'approved'
      });

      const response = await request(app)
        .get(`/orders/${testOrder._id}`)
        .set('x-user-id', otherUser._id.toString());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied');
    });

    it('should return 400 for invalid order ID format', async () => {
      const response = await request(app)
        .get('/orders/invalid-id')
        .set('x-user-id', testUser._id.toString());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid order ID');
    });
  });

  describe('Order Stock Management', () => {
    it('should handle concurrent order creation with stock validation', async () => {
      // Set product stock to 1
      await Product.findByIdAndUpdate(testProduct._id, { stock: 1 });

      const orderData = {
        items: [{
          productId: testProduct._id.toString(),
          quantity: 1,
          selectedOptions: [],
          subtotal: 500
        }],
        paymentType: '代引き',
        totalAmount: 500
      };

      // Create two concurrent orders
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/orders')
          .set('x-user-id', testUser._id.toString())
          .send(orderData),
        request(app)
          .post('/orders')
          .set('x-user-id', testUser._id.toString())
          .send(orderData)
      ]);

      // One should succeed, one should fail
      const responses = [response1, response2];
      const successCount = responses.filter(r => r.status === 201).length;
      const failCount = responses.filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      // Verify final stock is 0
      const finalProduct = await Product.findById(testProduct._id);
      expect(finalProduct?.stock).toBe(0);
    });
  });
});