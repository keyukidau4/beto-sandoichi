import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { register, login, logout, getCurrentUser } from '../authController';

// Mock JWT
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
app.post('/register', register);
app.post('/login', login);
app.post('/logout', logout);
app.get('/me', getCurrentUser);

describe('AuthController', () => {
  beforeEach(() => {
    // Reset JWT mock
    mockedJwt.sign.mockReturnValue('mock-token' as any);
    mockedJwt.verify.mockReturnValue({
      userId: 'mock-user-id',
      email: 'test@example.com',
      role: 'buyer'
    } as any);

    // Set environment variable for tests
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      tel: '123-456-7890',
      zip1: '123',
      zip2: '4567',
      address1: 'Test Address 1',
      address2: 'Test Address 2'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(validRegistrationData.email);
      expect(response.body.user.role).toBe('buyer');
      expect(response.body.user.status).toBe('pending');

      // Verify user was created in database
      const user = await User.findOne({ email: validRegistrationData.email });
      expect(user).toBeDefined();
      expect(user?.role).toBe('buyer');
      expect(user?.status).toBe('pending');

      // Verify buyer profile was created
      const buyerProfile = await BuyerProfile.findOne({ userId: user?._id });
      expect(buyerProfile).toBeDefined();
      expect(buyerProfile?.name).toBe(validRegistrationData.name);
      expect(buyerProfile?.point).toBe(0);

      // Verify JWT token was set as cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token-banhmi');
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration with short password', async () => {
      const invalidData = {
        ...validRegistrationData,
        password: '123'
      };

      const response = await request(app)
        .post('/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
    });

    it('should reject registration with duplicate email', async () => {
      // Create user first
      await User.create({
        email: validRegistrationData.email,
        password: await bcrypt.hash('password', 12),
        role: 'buyer',
        status: 'pending'
      });

      const response = await request(app)
        .post('/register')
        .send(validRegistrationData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should reject registration with missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'password123'
        // Missing name, tel, addresses
      };

      const response = await request(app)
        .post('/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /login', () => {
    let testUser: any;
    const testPassword = 'password123';

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      testUser = await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'buyer',
        status: 'approved'
      });

      // Create buyer profile
      await BuyerProfile.create({
        userId: testUser._id,
        name: 'Test User',
        tel: '123-456-7890',
        zip1: '123',
        zip2: '4567',
        address1: 'Test Address 1',
        address2: 'Test Address 2',
        point: 100
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: testPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBe('buyer');

      // Verify JWT token was set as cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token-banhmi');

      // Verify JWT was called with correct parameters
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          userId: testUser._id.toString(),
          email: testUser.email,
          role: testUser.role
        },
        'test-secret',
        { expiresIn: '24h' }
      );
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login for blacklisted user', async () => {
      // Update user status to blacklisted
      await User.findByIdAndUpdate(testUser._id, { status: 'blacklisted' });

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: testPassword
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Account has been blacklisted');
    });

    it('should reject login with validation errors', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'invalid-email',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error');
    });

    it('should update lastLogin timestamp', async () => {
      const beforeLogin = new Date();
      
      await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: testPassword
        });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.lastLogin).toBeDefined();
      expect(new Date(updatedUser!.lastLogin!)).toBeInstanceOf(Date);
      expect(new Date(updatedUser!.lastLogin!).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');

      // Verify cookie was cleared
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token-banhmi=;');
      expect(response.headers['set-cookie'][0]).toContain('Max-Age=0');
    });
  });

  describe('GET /me', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'buyer',
        status: 'approved'
      });

      await BuyerProfile.create({
        userId: testUser._id,
        name: 'Test User',
        tel: '123-456-7890',
        zip1: '123',
        zip2: '4567',
        address1: 'Test Address 1',
        address2: 'Test Address 2',
        point: 150
      });
    });

    it('should return current user info for authenticated user', async () => {
      // Mock the auth middleware by setting req.user
      const mockAuthMiddleware = (req: any, res: any, next: any) => {
        req.user = {
          userId: testUser._id.toString(),
          email: testUser.email,
          role: testUser.role
        };
        next();
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/me', mockAuthMiddleware, getCurrentUser);

      const response = await request(testApp)
        .get('/me');

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBe('buyer');
      expect(response.body.buyerProfile).toBeDefined();
      expect(response.body.buyerProfile.point).toBe(150);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before storing', async () => {
      const plainPassword = 'password123';
      
      await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          password: plainPassword,
          name: 'Test User',
          tel: '123-456-7890',
          zip1: '123',
          zip2: '4567',
          address1: 'Test Address 1',
          address2: 'Test Address 2'
        });

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user?.password).not.toBe(plainPassword);
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should verify hashed passwords during login', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      
      await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'buyer',
        status: 'approved'
      });

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: plainPassword
        });

      expect(response.status).toBe(200);
    });
  });
});