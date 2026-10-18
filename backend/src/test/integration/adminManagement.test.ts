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

describe('Admin Management Operations Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;
  let buyerId: string;
  let productId: string;

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
      name: 'Test Buyer',
      tel: '090-1234-5678',
      zip1: '123',
      zip2: '4567',
      address1: 'Tokyo',
      address2: 'Test',
      point: 500
    });
    await buyerProfile.save();

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

  describe('Requirement 2.1, 2.2, 2.3 - Product Management', () => {
    it('should allow admin to create new product', async () => {
      const productData = {
        name: 'Admin Created Bánh Mì',
        type: 'banhmi',
        description: 'Product created by admin',
        price: 600,
        stock: 20,
        options: [
          { name: 'パクチー', extraCost: 50 },
          { name: 'チリソース', extraCost: 0 }
        ]
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product.name).toBe(productData.name);
      expect(response.body.product.type).toBe(productData.type);
      expect(response.body.product.price).toBe(productData.price);
      expect(response.body.product.stock).toBe(productData.stock);

      productId = response.body.product._id;
    });

    it('should allow admin to update existing product', async () => {
      const updateData = {
        name: 'Updated Bánh Mì',
        price: 700,
        stock: 25
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.product.name).toBe(updateData.name);
      expect(response.body.product.price).toBe(updateData.price);
      expect(response.body.product.stock).toBe(updateData.stock);
    });

    it('should allow admin to soft delete product', async () => {
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Product deleted successfully');

      // Verify product is soft deleted
      const product = await Product.findById(productId);
      expect(product!.del_flg).toBe(true);
    });

    it('should prevent non-admin from managing products', async () => {
      const productData = {
        name: 'Unauthorized Product',
        type: 'banhmi',
        description: 'Should not be created',
        price: 500,
        stock: 10
      };

      const response = await request(app)
        .post('/api/products')
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .send(productData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Requirement 7.1 - User Management', () => {
    it('should allow admin to view all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);

      const buyer = response.body.users.find((u: any) => u.email === 'buyer@test.com');
      expect(buyer).toBeTruthy();
    });

    it('should allow admin to update user status', async () => {
      // Create a pending user first
      const pendingUser = new User({
        email: 'pending@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'pending'
      });
      await pendingUser.save();

      const response = await request(app)
        .put(`/api/admin/users/${pendingUser._id}/status`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');

      // Verify status was updated
      const updatedUser = await User.findById(pendingUser._id);
      expect(updatedUser!.status).toBe('approved');
    });

    it('should allow admin to update user points', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${buyerId}/points`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({ points: 1000, note: 'Admin bonus points' })
        .expect(200);

      expect(response.body.message).toBe('Points updated successfully');

      // Verify points were updated
      const profile = await BuyerProfile.findOne({ userId: buyerId });
      expect(profile!.point).toBe(1000);

      // Verify point transaction was created
      const transaction = await PointTransaction.findOne({
        userId: buyerId,
        type: 'bank_deposit_transfer_add'
      });
      expect(transaction).toBeTruthy();
      expect(transaction!.amount).toBe(500); // Difference from original 500
    });
  });

  describe('Requirement 8.1, 8.2, 8.3 - Analytics', () => {
    beforeAll(async () => {
      // Create test data for analytics
      const testProduct = new Product({
        name: 'Analytics Test Product',
        type: 'banhmi',
        description: 'For analytics testing',
        price: 400,
        stock: 50
      });
      await testProduct.save();

      // Create product views
      const productView = new ProductView({
        productId: testProduct._id,
        date: new Date().toISOString().split('T')[0],
        count: 10
      });
      await productView.save();

      // Create test orders
      const testOrder = new Order({
        buyerId: buyerId,
        items: [{
          productId: testProduct._id,
          quantity: 3,
          selectedOptions: [],
          subtotal: 1200
        }],
        paymentType: '代引き',
        totalAmount: 1200,
        status: 'completed'
      });
      await testOrder.save();
    });

    it('should provide analytics data to admin', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.topOrderedProducts).toBeDefined();
      expect(response.body.analytics.topViewedProducts).toBeDefined();
      expect(response.body.analytics.userRegistrations).toBeDefined();
    });

    it('should show top ordered products', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`);

      const topOrdered = response.body.analytics.topOrderedProducts;
      expect(Array.isArray(topOrdered)).toBe(true);
      
      if (topOrdered.length > 0) {
        expect(topOrdered[0]).toHaveProperty('productName');
        expect(topOrdered[0]).toHaveProperty('totalOrdered');
      }
    });

    it('should show top viewed products', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${adminToken}`);

      const topViewed = response.body.analytics.topViewedProducts;
      expect(Array.isArray(topViewed)).toBe(true);
      
      if (topViewed.length > 0) {
        expect(topViewed[0]).toHaveProperty('productName');
        expect(topViewed[0]).toHaveProperty('totalViews');
      }
    });

    it('should prevent non-admin from accessing analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Requirement 9.1, 9.2 - Inventory Management', () => {
    let staffToken: string;

    beforeAll(async () => {
      // Create staff user
      const staffUser = new User({
        email: 'staff@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'staff',
        status: 'approved'
      });
      await staffUser.save();

      const staffLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@test.com', password: 'password123' });
      staffToken = extractTokenFromCookie(staffLogin.headers);
    });

    it('should allow staff to view inventory', async () => {
      const response = await request(app)
        .get('/api/staff/inventory')
        .set('Cookie', `token-banhmi=${staffToken}`)
        .expect(200);

      expect(response.body.products).toBeDefined();
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should show low stock warnings to staff', async () => {
      // Create a low stock product
      const lowStockProduct = new Product({
        name: 'Low Stock Product',
        type: 'banhmi',
        description: 'Product with low stock',
        price: 300,
        stock: 3 // Below threshold of 5
      });
      await lowStockProduct.save();

      const response = await request(app)
        .get('/api/staff/inventory')
        .set('Cookie', `token-banhmi=${staffToken}`);

      const lowStockItem = response.body.products.find(
        (p: any) => p.name === 'Low Stock Product'
      );
      expect(lowStockItem).toBeTruthy();
      expect(lowStockItem.stock).toBeLessThan(5);
    });

    it('should prevent staff from modifying products', async () => {
      const updateData = {
        name: 'Staff Updated Product',
        price: 999
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Cookie', `token-banhmi=${staffToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Requirement 6.2, 6.3, 6.4 - Contact Request Management', () => {
    it('should allow buyer to submit contact request', async () => {
      const contactData = {
        type: 'update-info',
        content: 'I would like to update my address information'
      };

      const response = await request(app)
        .post('/api/users/contact')
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .send(contactData)
        .expect(201);

      expect(response.body.message).toBe('Contact request submitted successfully');
      expect(response.body.contactRequest.status).toBe('pending');
    });

    it('should allow admin to view contact requests', async () => {
      const response = await request(app)
        .get('/api/admin/contact-requests')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.requests).toBeDefined();
      expect(Array.isArray(response.body.requests)).toBe(true);
    });

    it('should allow admin to respond to contact requests', async () => {
      // Get the contact request
      const requestsResponse = await request(app)
        .get('/api/admin/contact-requests')
        .set('Cookie', `token-banhmi=${adminToken}`);

      if (requestsResponse.body.requests.length > 0) {
        const requestId = requestsResponse.body.requests[0]._id;

        const response = await request(app)
          .put(`/api/admin/contact-requests/${requestId}`)
          .set('Cookie', `token-banhmi=${adminToken}`)
          .send({
            adminResponse: 'Your request has been processed',
            status: 'done'
          })
          .expect(200);

        expect(response.body.message).toBe('Contact request updated successfully');
      }
    });
  });
});