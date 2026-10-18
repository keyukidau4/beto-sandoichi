import request from 'supertest';
import { createTestApp } from '../app';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { EmailTemplate } from '../../models/EmailTemplate';

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  console.log('Headers:', headers);
  console.log('Set-Cookie:', headers['set-cookie']);
  const cookieHeader = headers['set-cookie']?.find((cookie: string) => cookie.startsWith('token-banhmi='));
  console.log('Found cookie:', cookieHeader);
  const token = cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : '';
  console.log('Extracted token:', token);
  return token;
};

const app = createTestApp();

describe('User Registration and Approval Flow Integration Tests', () => {
  let adminToken: string;
  let buyerUserId: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi', // password123
      role: 'admin',
      status: 'approved'
    });
    await adminUser.save();

    // Login as admin to get token
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    adminToken = extractTokenFromCookie(adminLoginResponse.headers);

    // Create email template for approval
    const emailTemplate = new EmailTemplate({
      title: 'Account Approved',
      content: 'Your account has been approved. You can now use all features.',
      type: 'approval'
    });
    await emailTemplate.save();
  });

  describe('Requirement 1.1 - User Registration', () => {
    it('should register a new buyer with pending status', async () => {
      const registrationData = {
        email: 'buyer@test.com',
        password: 'password123',
        name: 'Test Buyer',
        tel: '090-1234-5678',
        zip1: '123',
        zip2: '4567',
        address1: 'Tokyo',
        address2: 'Shibuya'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(response.body.message).toBe('Registration successful. Account pending approval.');
      expect(response.body.user.email).toBe('buyer@test.com');
      expect(response.body.user.role).toBe('buyer');
      expect(response.body.user.status).toBe('pending');

      // Verify user was created in database
      const user = await User.findOne({ email: 'buyer@test.com' });
      expect(user).toBeTruthy();
      expect(user!.status).toBe('pending');
      expect(user!.role).toBe('buyer');

      // Verify buyer profile was created
      const buyerProfile = await BuyerProfile.findOne({ userId: user!._id });
      expect(buyerProfile).toBeTruthy();
      expect(buyerProfile!.name).toBe('Test Buyer');
      expect(buyerProfile!.point).toBe(0);

      buyerUserId = user!._id.toString();
    });

    it('should not allow duplicate email registration', async () => {
      const duplicateData = {
        email: 'buyer@test.com',
        password: 'password123',
        name: 'Another Buyer',
        tel: '090-9876-5432',
        zip1: '987',
        zip2: '6543',
        address1: 'Osaka',
        address2: 'Namba'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.message).toContain('User with this email already exists');
    });
  });

  describe('Requirement 1.2 - User Login with Pending Status', () => {
    it('should allow pending user to login but with limited access', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.status).toBe('pending');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('Requirement 1.4 & 7.1 - Admin User Approval', () => {
    it('should allow admin to view pending users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      const pendingUser = response.body.users.find((u: any) => u.email === 'buyer@test.com');
      expect(pendingUser).toBeTruthy();
      expect(pendingUser.status).toBe('pending');
    });

    it('should allow admin to approve pending user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${buyerUserId}/status`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');

      // Verify user status was updated
      const user = await User.findById(buyerUserId);
      expect(user!.status).toBe('approved');
    });

    it('should allow admin to blacklist user', async () => {
      // Create another user to blacklist
      const testUser = new User({
        email: 'blacklist@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'approved'
      });
      await testUser.save();

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({ status: 'blacklisted' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');

      // Verify user was blacklisted
      const blacklistedUser = await User.findById(testUser._id);
      expect(blacklistedUser!.status).toBe('blacklisted');
    });
  });

  describe('Requirement 1.3 - Role-based Authorization', () => {
    let approvedBuyerToken: string;

    beforeAll(async () => {
      // Login as approved buyer
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'password123'
        });

      approvedBuyerToken = extractTokenFromCookie(response.headers);
    });

    it('should allow approved buyer to access buyer-only features', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .expect(200);

      expect(response.body.profile).toBeDefined();
    });

    it('should prevent buyer from accessing admin features', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token-banhmi=${approvedBuyerToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should allow admin to access admin features', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
    });
  });

  describe('Requirement 1.5 - Staff Role Access', () => {
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

      // Login as staff
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'staff@test.com',
          password: 'password123'
        });

      staffToken = extractTokenFromCookie(response.headers);
    });

    it('should allow staff to access inventory information', async () => {
      const response = await request(app)
        .get('/api/staff/inventory')
        .set('Cookie', `token-banhmi=${staffToken}`)
        .expect(200);

      expect(response.body.products).toBeDefined();
    });

    it('should prevent staff from accessing admin features', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', `token-banhmi=${staffToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });
});