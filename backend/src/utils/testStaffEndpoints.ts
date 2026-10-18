import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test staff endpoints
async function testStaffEndpoints() {
  console.log('🧪 Testing Staff Inventory Management Endpoints...\n');

  try {
    // First, we need to login as a staff user
    // For testing, we'll assume there's a staff user created
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'staff@test.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Staff login successful');
    
    // Get cookies from login response
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // Test inventory overview
    console.log('\n📦 Testing inventory overview...');
    const inventoryResponse = await axios.get(`${BASE_URL}/staff/inventory`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    console.log('✅ Inventory overview:', inventoryResponse.data.data.length, 'products');

    // Test low stock products
    console.log('\n⚠️ Testing low stock products...');
    const lowStockResponse = await axios.get(`${BASE_URL}/staff/inventory/low-stock`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    console.log('✅ Low stock products:', lowStockResponse.data.data.length, 'products');

    // Test inventory stats
    console.log('\n📊 Testing inventory stats...');
    const statsResponse = await axios.get(`${BASE_URL}/staff/inventory/stats`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    console.log('✅ Inventory stats:', statsResponse.data.data);

    // Test recent stock history
    console.log('\n📋 Testing recent stock history...');
    const historyResponse = await axios.get(`${BASE_URL}/staff/inventory/history?limit=10`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    console.log('✅ Recent stock history:', historyResponse.data.data.length, 'entries');

    // Test product details (if we have products)
    if (inventoryResponse.data.data.length > 0) {
      const productId = inventoryResponse.data.data[0]._id;
      
      console.log('\n🔍 Testing product details...');
      const productResponse = await axios.get(`${BASE_URL}/staff/products/${productId}`, {
        headers: {
          Cookie: cookieHeader
        }
      });
      console.log('✅ Product details:', productResponse.data.data.name);

      console.log('\n📈 Testing product stock history...');
      const productHistoryResponse = await axios.get(`${BASE_URL}/staff/products/${productId}/history`, {
        headers: {
          Cookie: cookieHeader
        }
      });
      console.log('✅ Product stock history:', productHistoryResponse.data.data.history.length, 'entries');
    }

    console.log('\n🎉 All staff endpoint tests passed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: You may need to create a staff user first.');
      console.log('   You can create one using the admin interface or by running:');
      console.log('   npm run create-test-users');
    }
  }
}

// Run the test
testStaffEndpoints();