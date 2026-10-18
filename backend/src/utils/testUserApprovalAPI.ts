import axios from 'axios';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';

const API_BASE = 'http://localhost:5000/api';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

const testUserApprovalAPI = async () => {
  const results: TestResult[] = [];
  let adminToken = '';

  try {
    console.log('🧪 Testing User Approval API Endpoints...');

    // Connect to database to create test data
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banhmi-app');

    // Create admin user for testing
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    // Login as admin
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: adminUser.email,
        password: 'admin123' // Assuming this is the admin password
      }, {
        withCredentials: true
      });

      if (loginResponse.data.success) {
        adminToken = loginResponse.headers['set-cookie']?.[0] || '';
        results.push({
          test: 'Admin Login',
          success: true,
          message: 'Successfully logged in as admin'
        });
      }
    } catch (error: any) {
      results.push({
        test: 'Admin Login',
        success: false,
        message: `Login failed: ${error.response?.data?.message || error.message}`
      });
      return results;
    }

    // Test 1: Get all users
    try {
      const response = await axios.get(`${API_BASE}/users`, {
        headers: {
          Cookie: adminToken
        }
      });

      results.push({
        test: 'Get All Users',
        success: response.data.success,
        message: `Retrieved ${response.data.data?.length || 0} users`,
        data: response.data.data?.length
      });
    } catch (error: any) {
      results.push({
        test: 'Get All Users',
        success: false,
        message: `Failed: ${error.response?.data?.message || error.message}`
      });
    }

    // Test 2: Get user statistics
    try {
      const response = await axios.get(`${API_BASE}/users/statistics`, {
        headers: {
          Cookie: adminToken
        }
      });

      results.push({
        test: 'Get User Statistics',
        success: response.data.success,
        message: `Total users: ${response.data.data?.total || 0}`,
        data: response.data.data
      });
    } catch (error: any) {
      results.push({
        test: 'Get User Statistics',
        success: false,
        message: `Failed: ${error.response?.data?.message || error.message}`
      });
    }

    // Create test users for status update tests
    const testUsers = [];
    for (let i = 1; i <= 3; i++) {
      try {
        const user = await User.create({
          email: `test-approval-${i}@example.com`,
          password: 'password123',
          role: 'buyer',
          status: 'pending'
        });

        await BuyerProfile.create({
          userId: user._id,
          name: `テスト承認ユーザー${i}`,
          tel: '090-1234-5678',
          zip1: '123',
          zip2: '4567',
          address1: '東京都渋谷区',
          address2: 'テスト町1-2-3',
          point: 0
        });

        testUsers.push(user);
      } catch (error) {
        // User might already exist, skip
      }
    }

    if (testUsers.length > 0) {
      // Test 3: Update single user status
      try {
        const response = await axios.put(
          `${API_BASE}/users/${testUsers[0]._id}/status`,
          { status: 'approved' },
          {
            headers: {
              Cookie: adminToken,
              'Content-Type': 'application/json'
            }
          }
        );

        results.push({
          test: 'Update Single User Status',
          success: response.data.success,
          message: `Updated user status to approved`,
          data: response.data.data?.status
        });
      } catch (error: any) {
        results.push({
          test: 'Update Single User Status',
          success: false,
          message: `Failed: ${error.response?.data?.message || error.message}`
        });
      }

      // Test 4: Bulk update user status
      if (testUsers.length >= 2) {
        try {
          const userIds = testUsers.slice(1).map(u => u._id.toString());
          const response = await axios.put(
            `${API_BASE}/users/bulk/status`,
            { 
              userIds,
              status: 'approved'
            },
            {
              headers: {
                Cookie: adminToken,
                'Content-Type': 'application/json'
              }
            }
          );

          results.push({
            test: 'Bulk Update User Status',
            success: response.data.success,
            message: `Bulk updated ${response.data.data?.modifiedCount || 0} users`,
            data: response.data.data
          });
        } catch (error: any) {
          results.push({
            test: 'Bulk Update User Status',
            success: false,
            message: `Failed: ${error.response?.data?.message || error.message}`
          });
        }
      }

      // Test 5: Blacklist user
      try {
        const response = await axios.put(
          `${API_BASE}/users/${testUsers[0]._id}/status`,
          { status: 'blacklisted' },
          {
            headers: {
              Cookie: adminToken,
              'Content-Type': 'application/json'
            }
          }
        );

        results.push({
          test: 'Blacklist User',
          success: response.data.success,
          message: `User blacklisted successfully`,
          data: response.data.data?.status
        });
      } catch (error: any) {
        results.push({
          test: 'Blacklist User',
          success: false,
          message: `Failed: ${error.response?.data?.message || error.message}`
        });
      }
    }

    // Test 6: Test unauthorized access (without admin token)
    try {
      const response = await axios.get(`${API_BASE}/users`);
      results.push({
        test: 'Unauthorized Access Protection',
        success: false,
        message: 'Should have been blocked but wasn\'t'
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        results.push({
          test: 'Unauthorized Access Protection',
          success: true,
          message: 'Correctly blocked unauthorized access'
        });
      } else {
        results.push({
          test: 'Unauthorized Access Protection',
          success: false,
          message: `Unexpected error: ${error.message}`
        });
      }
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  } finally {
    await mongoose.disconnect();
  }

  // Print results
  console.log('\n📊 Test Results:');
  console.log('================');
  
  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
    if (result.data) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
    }
    
    if (result.success) passed++;
    else failed++;
  });

  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  return results;
};

// Run the test if this file is executed directly
if (require.main === module) {
  testUserApprovalAPI();
}

export default testUserApprovalAPI;