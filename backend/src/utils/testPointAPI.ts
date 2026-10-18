import axios from 'axios';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import connectDB from '../config/database';
import mongoose from 'mongoose';

const API_BASE = 'http://localhost:5000/api';

interface LoginResponse {
  message: string;
  user: {
    _id: string;
    email: string;
    role: string;
    status: string;
  };
}

async function testPointAPI() {
  try {
    console.log('🧪 Testing Point API Endpoints...\n');

    // Connect to database to get test users
    await connectDB();

    // Find test users
    const testBuyer = await User.findOne({ 
      role: 'buyer', 
      email: { $regex: /buyer@test\.com|approved-buyer@test\.com/i } 
    });
    
    const testAdmin = await User.findOne({ 
      role: 'admin', 
      email: 'admin@test.com'
    });

    if (!testBuyer || !testAdmin) {
      console.log('❌ Test users not found. Please create test users first.');
      return;
    }

    console.log(`✅ Found test buyer: ${testBuyer.email}`);
    console.log(`✅ Found test admin: ${testAdmin.email}\n`);

    // Login as buyer
    console.log('🔐 Logging in as buyer...');
    const buyerLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testBuyer.email,
      password: 'password123'
    }, {
      withCredentials: true
    });

    const buyerCookies = buyerLoginResponse.headers['set-cookie'];
    console.log('✅ Buyer login successful\n');

    // Login as admin
    console.log('🔐 Logging in as admin...');
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testAdmin.email,
      password: 'admin123'
    }, {
      withCredentials: true
    });

    const adminCookies = adminLoginResponse.headers['set-cookie'];
    console.log('✅ Admin login successful\n');

    // Test 1: Get point balance (buyer)
    console.log('💰 Test 1: Get Point Balance (Buyer)');
    try {
      const balanceResponse = await axios.get(`${API_BASE}/points/balance`, {
        headers: {
          Cookie: buyerCookies?.join('; ')
        }
      });
      
      console.log('✅ Point balance retrieved:');
      console.log(`  Balance: ${balanceResponse.data.balance} points`);
      console.log(`  Recent transactions: ${balanceResponse.data.recentTransactions.length}`);
    } catch (error: any) {
      console.log('❌ Failed to get point balance:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test 2: Get point history (buyer)
    console.log('📜 Test 2: Get Point History (Buyer)');
    try {
      const historyResponse = await axios.get(`${API_BASE}/points/history?page=1&limit=10`, {
        headers: {
          Cookie: buyerCookies?.join('; ')
        }
      });
      
      console.log('✅ Point history retrieved:');
      console.log(`  Total transactions: ${historyResponse.data.pagination.totalTransactions}`);
      console.log(`  Current page: ${historyResponse.data.pagination.currentPage}`);
      
      if (historyResponse.data.transactions.length > 0) {
        console.log('  Recent transactions:');
        historyResponse.data.transactions.slice(0, 3).forEach((tx: any, index: number) => {
          console.log(`    ${index + 1}. ${tx.type}: ${tx.amount > 0 ? '+' : ''}${tx.amount} points - ${tx.note}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Failed to get point history:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test 3: Validate points for payment (buyer)
    console.log('🔍 Test 3: Validate Points for Payment (Buyer)');
    try {
      const validateResponse = await axios.post(`${API_BASE}/points/validate`, {
        amount: 100
      }, {
        headers: {
          Cookie: buyerCookies?.join('; ')
        }
      });
      
      console.log('✅ Point validation result:');
      console.log(`  Is valid: ${validateResponse.data.isValid}`);
      console.log(`  Available: ${validateResponse.data.availablePoints} points`);
      console.log(`  Required: ${validateResponse.data.requiredPoints} points`);
      if (validateResponse.data.message) {
        console.log(`  Message: ${validateResponse.data.message}`);
      }
    } catch (error: any) {
      console.log('❌ Failed to validate points:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test 4: Get all user points (admin)
    console.log('👥 Test 4: Get All User Points (Admin)');
    try {
      const allPointsResponse = await axios.get(`${API_BASE}/points/admin/users?page=1&limit=5`, {
        headers: {
          Cookie: adminCookies?.join('; ')
        }
      });
      
      console.log('✅ All user points retrieved:');
      console.log(`  Total profiles: ${allPointsResponse.data.pagination.totalProfiles}`);
      console.log('  Top users by points:');
      
      allPointsResponse.data.profiles.slice(0, 3).forEach((profile: any, index: number) => {
        console.log(`    ${index + 1}. ${profile.userId?.email || 'Unknown'}: ${profile.point} points`);
      });
    } catch (error: any) {
      console.log('❌ Failed to get all user points:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test 5: Admin adjust points
    console.log('⚙️ Test 5: Admin Adjust Points');
    try {
      const adjustResponse = await axios.put(`${API_BASE}/points/admin/users/${testBuyer._id}/adjust`, {
        amount: 50,
        note: 'API test point adjustment'
      }, {
        headers: {
          Cookie: adminCookies?.join('; ')
        }
      });
      
      console.log('✅ Points adjusted successfully:');
      console.log(`  New balance: ${adjustResponse.data.newBalance} points`);
      console.log(`  Transaction ID: ${adjustResponse.data.transaction._id}`);
    } catch (error: any) {
      console.log('❌ Failed to adjust points:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test 6: Admin get user point history
    console.log('📊 Test 6: Admin Get User Point History');
    try {
      const adminHistoryResponse = await axios.get(`${API_BASE}/points/admin/users/${testBuyer._id}/history?page=1&limit=5`, {
        headers: {
          Cookie: adminCookies?.join('; ')
        }
      });
      
      console.log('✅ User point history retrieved by admin:');
      console.log(`  User: ${adminHistoryResponse.data.user.email}`);
      console.log(`  Current balance: ${adminHistoryResponse.data.currentBalance} points`);
      console.log(`  Total transactions: ${adminHistoryResponse.data.pagination.totalTransactions}`);
      
      if (adminHistoryResponse.data.transactions.length > 0) {
        console.log('  Recent transactions:');
        adminHistoryResponse.data.transactions.slice(0, 3).forEach((tx: any, index: number) => {
          console.log(`    ${index + 1}. ${tx.type}: ${tx.amount > 0 ? '+' : ''}${tx.amount} points - ${tx.note}`);
        });
      }
    } catch (error: any) {
      console.log('❌ Failed to get user point history:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test 7: Unauthorized access (no auth)
    console.log('🚫 Test 7: Unauthorized Access');
    try {
      await axios.get(`${API_BASE}/points/balance`);
      console.log('❌ Unauthorized access should have failed');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access properly blocked');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }
    console.log();

    // Test 8: Buyer trying to access admin endpoints
    console.log('🚫 Test 8: Buyer Accessing Admin Endpoints');
    try {
      await axios.get(`${API_BASE}/points/admin/users`, {
        headers: {
          Cookie: buyerCookies?.join('; ')
        }
      });
      console.log('❌ Buyer access to admin endpoint should have failed');
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('✅ Buyer access to admin endpoint properly blocked');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }
    console.log();

    console.log('🎉 All Point API tests completed!');

  } catch (error) {
    console.error('❌ Point API test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
if (require.main === module) {
  testPointAPI();
}

export { testPointAPI };