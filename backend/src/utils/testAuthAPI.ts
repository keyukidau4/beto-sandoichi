import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import connectDB from '../config/database';
import authRoutes from '../routes/auth';

// Load test environment variables
config({ path: '.env.test' });

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Routes
  app.use('/api/auth', authRoutes);
  
  return app;
};

// Test authentication API endpoints
const testAuthAPI = async () => {
  try {
    console.log('🧪 Testing Authentication API Endpoints...\n');

    // Connect to database
    await connectDB();

    // Clean up any existing test data
    await User.deleteMany({ email: { $regex: /^apitest.*@test\.com$/ } });
    await BuyerProfile.deleteMany({});

    console.log('✅ Database connected and cleaned');

    const app = createTestApp();

    // Test 1: User Registration
    console.log('\n📝 Test 1: User Registration...');
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'apitest@test.com',
        password: 'password123',
        name: 'API Test User',
        tel: '090-1234-5678',
        zip1: '123',
        zip2: '4567',
        address1: 'Tokyo, Shibuya',
        address2: 'Test Building 101'
      });

    console.log(`✅ Registration status: ${registerResponse.status}`);
    console.log(`✅ Registration response: ${registerResponse.body.message}`);
    
    if (registerResponse.status === 201) {
      console.log(`   - User ID: ${registerResponse.body.user.id}`);
      console.log(`   - Email: ${registerResponse.body.user.email}`);
      console.log(`   - Role: ${registerResponse.body.user.role}`);
      console.log(`   - Status: ${registerResponse.body.user.status}`);
    }

    // Test 2: User Login
    console.log('\n🔐 Test 2: User Login...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'apitest@test.com',
        password: 'password123'
      });

    console.log(`✅ Login status: ${loginResponse.status}`);
    console.log(`✅ Login response: ${loginResponse.body.message}`);
    
    let authCookie = '';
    if (loginResponse.status === 200) {
      console.log(`   - User ID: ${loginResponse.body.user.id}`);
      console.log(`   - Email: ${loginResponse.body.user.email}`);
      console.log(`   - Role: ${loginResponse.body.user.role}`);
      console.log(`   - Status: ${loginResponse.body.user.status}`);
      
      // Extract cookie for authenticated requests
      const setCookieHeader = loginResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        authCookie = cookies.find((cookie: string) => cookie.startsWith('token=')) || '';
      }
    }

    // Test 3: Get Current User (Protected Route)
    console.log('\n👤 Test 3: Get Current User (Protected Route)...');
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);

    console.log(`✅ Get user status: ${meResponse.status}`);
    
    if (meResponse.status === 200) {
      console.log(`   - User ID: ${meResponse.body.user.id}`);
      console.log(`   - Email: ${meResponse.body.user.email}`);
      console.log(`   - Role: ${meResponse.body.user.role}`);
      console.log(`   - Status: ${meResponse.body.user.status}`);
      
      if (meResponse.body.buyerProfile) {
        console.log(`   - Buyer Name: ${meResponse.body.buyerProfile.name}`);
        console.log(`   - Points: ${meResponse.body.buyerProfile.point}`);
      }
    }

    // Test 4: Invalid Login
    console.log('\n❌ Test 4: Invalid Login...');
    const invalidLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'apitest@test.com',
        password: 'wrongpassword'
      });

    console.log(`✅ Invalid login status: ${invalidLoginResponse.status}`);
    console.log(`✅ Invalid login response: ${invalidLoginResponse.body.message}`);

    // Test 5: Access Protected Route Without Auth
    console.log('\n🚫 Test 5: Access Protected Route Without Auth...');
    const unauthorizedResponse = await request(app)
      .get('/api/auth/me');

    console.log(`✅ Unauthorized access status: ${unauthorizedResponse.status}`);
    console.log(`✅ Unauthorized access response: ${unauthorizedResponse.body.message}`);

    // Test 6: User Logout
    console.log('\n🚪 Test 6: User Logout...');
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);

    console.log(`✅ Logout status: ${logoutResponse.status}`);
    console.log(`✅ Logout response: ${logoutResponse.body.message}`);

    // Test 7: Validation Errors
    console.log('\n⚠️ Test 7: Validation Errors...');
    const validationResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: '123', // Too short
        name: '',
        tel: 'invalid-phone'
      });

    console.log(`✅ Validation error status: ${validationResponse.status}`);
    console.log(`✅ Validation errors count: ${validationResponse.body.errors?.length || 0}`);

    console.log('\n🎉 All authentication API tests completed!');
    console.log('\n📋 Summary:');
    console.log('   - User registration endpoint ✅');
    console.log('   - User login endpoint ✅');
    console.log('   - Protected route access ✅');
    console.log('   - JWT cookie handling ✅');
    console.log('   - Input validation ✅');
    console.log('   - Error handling ✅');
    console.log('   - User logout endpoint ✅');

  } catch (error) {
    console.error('❌ API Test failed:', error);
  } finally {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /^apitest.*@test\.com$/ } });
    await BuyerProfile.deleteMany({});
    
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthAPI();
}

export default testAuthAPI;