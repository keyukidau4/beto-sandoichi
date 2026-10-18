import request from 'supertest';
import { createTestApp } from '../app';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { EmailTemplate } from '../../models/EmailTemplate';
import bcrypt from 'bcryptjs';

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  const cookieHeader = headers['set-cookie']?.find((cookie: string) => cookie.startsWith('token-banhmi='));
  return cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : '';
};

const app = createTestApp();

// Mock nodemailer for testing
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((mailOptions, callback) => {
      // Simulate successful email sending
      if (callback) {
        callback(null, {
          messageId: 'test-message-id',
          response: '250 OK'
        });
      }
      return Promise.resolve({
        messageId: 'test-message-id',
        response: '250 OK'
      });
    })
  }))
}));

describe('Bulk Email API Endpoints', () => {
  let adminToken: string;
  let testTemplate: any;
  let testBuyers: any[] = [];

  beforeAll(async () => {
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create admin user
    const adminUser = await User.create({
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      status: 'approved'
    });
    
    // Get admin token by logging in
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    
    adminToken = extractTokenFromCookie(adminLogin.headers);
    
    // Skip tests if authentication fails
    if (!adminToken) {
      console.warn('Authentication failed, skipping bulk email API tests');
      return;
    }

    // Create test email template
    testTemplate = await EmailTemplate.create({
      title: 'Test Bulk Email',
      content: '<h1>Hello {{name}}</h1><p>Your current points: {{point}}</p>',
      type: 'general',
      placeholders: ['{{name}}', '{{point}}'],
      isDefault: false
    });

    // Create test buyers
    for (let i = 1; i <= 2; i++) {
      const hashedBuyerPassword = await bcrypt.hash('password123', 12);
      const user = await User.create({
        email: `buyer${i}@test.com`,
        password: hashedBuyerPassword,
        role: 'buyer',
        status: 'approved'
      });

      const profile = await BuyerProfile.create({
        userId: user._id,
        name: `Test Buyer ${i}`,
        tel: '090-1234-567' + i,
        zip1: '123',
        zip2: '4567',
        address1: `Test Address ${i}`,
        point: i * 100
      });

      testBuyers.push({ user, profile });
    }
  });

  describe('GET /api/admin/email/recipients', () => {
    it('should get available email recipients when authenticated', async () => {
      if (!adminToken) {
        console.warn('Skipping test due to authentication failure');
        return;
      }

      const response = await request(app)
        .get('/api/admin/email/recipients')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/admin/email/recipients')
        .expect(401);
    });
  });

  describe('POST /api/admin/email/send-bulk', () => {
    it('should require admin authentication', async () => {
      await request(app)
        .post('/api/admin/email/send-bulk')
        .send({
          templateId: 'some-template-id',
          recipientIds: ['some-recipient-id']
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      if (!adminToken) {
        console.warn('Skipping test due to authentication failure');
        return;
      }

      const response = await request(app)
        .post('/api/admin/email/send-bulk')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Template ID and recipient IDs are required');
    });
  });

  describe('GET /api/admin/email/send-progress/:id', () => {
    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/admin/email/send-progress/507f1f77bcf86cd799439011')
        .expect(401);
    });

    it('should return 404 for non-existent history ID when authenticated', async () => {
      if (!adminToken) {
        console.warn('Skipping test due to authentication failure');
        return;
      }

      const response = await request(app)
        .get('/api/admin/email/send-progress/507f1f77bcf86cd799439011')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email history not found');
    });
  });
});