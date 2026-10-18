import axios from 'axios';
import { config } from 'dotenv';

config();

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  message: string;
  response?: any;
}

const results: TestResult[] = [];

// Helper function to add test result
const addResult = (endpoint: string, method: string, status: 'PASS' | 'FAIL', message: string, response?: any) => {
  results.push({ endpoint, method, status, message, response });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${method} ${endpoint}: ${message}`);
};

// Test data
let authToken = '';
let testProductId = '';
let testOrderId = '';

const testOrderEndpoints = async () => {
  console.log('🧪 Testing Order API Endpoints...\n');

  try {
    // Step 1: Login as buyer to get auth token
    console.log('1. Authenticating as buyer...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'buyer@test.com',
        password: 'password123'
      });

      // Extract token from Set-Cookie header
      const setCookieHeader = loginResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const tokenCookie = setCookieHeader.find((cookie: string) => cookie.startsWith('token-banhmi='));
        if (tokenCookie) {
          authToken = tokenCookie.split(';')[0].split('=')[1];
        }
      }

      if (authToken) {
        addResult('/auth/login', 'POST', 'PASS', 'Successfully authenticated as buyer');
      } else {
        addResult('/auth/login', 'POST', 'FAIL', 'No auth token received');
        return;
      }
    } catch (error: any) {
      addResult('/auth/login', 'POST', 'FAIL', `Authentication failed: ${error.response?.data?.message || error.message}`);
      return;
    }

    // Step 2: Get products to use in order
    console.log('\n2. Getting products for order...');
    try {
      const productsResponse = await axios.get(`${API_BASE}/products`);
      const products = productsResponse.data.products;
      
      if (products && products.length > 0) {
        testProductId = products[0]._id;
        addResult('/products', 'GET', 'PASS', `Found ${products.length} products for testing`);
      } else {
        addResult('/products', 'GET', 'FAIL', 'No products found for testing');
        return;
      }
    } catch (error: any) {
      addResult('/products', 'GET', 'FAIL', `Failed to get products: ${error.response?.data?.message || error.message}`);
      return;
    }

    // Step 3: Test creating an order with COD payment
    console.log('\n3. Testing order creation with COD payment...');
    try {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
            selectedOptions: ['パクチー']
          }
        ],
        paymentType: '代引き'
      };

      const createOrderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
        headers: {
          'Cookie': `token-banhmi=${authToken}`
        }
      });

      if (createOrderResponse.status === 201) {
        testOrderId = createOrderResponse.data.order._id;
        addResult('/orders', 'POST', 'PASS', 'Successfully created order with COD payment', {
          orderId: testOrderId,
          totalAmount: createOrderResponse.data.order.totalAmount,
          paymentType: createOrderResponse.data.order.paymentType
        });
      }
    } catch (error: any) {
      addResult('/orders', 'POST', 'FAIL', `Failed to create order: ${error.response?.data?.message || error.message}`);
    }

    // Step 4: Test getting user orders
    console.log('\n4. Testing get user orders...');
    try {
      const ordersResponse = await axios.get(`${API_BASE}/orders`, {
        headers: {
          'Cookie': `token-banhmi=${authToken}`
        }
      });

      if (ordersResponse.status === 200) {
        const orders = ordersResponse.data.orders;
        addResult('/orders', 'GET', 'PASS', `Successfully retrieved ${orders.length} orders`, {
          ordersCount: orders.length,
          pagination: ordersResponse.data.pagination
        });
      }
    } catch (error: any) {
      addResult('/orders', 'GET', 'FAIL', `Failed to get orders: ${error.response?.data?.message || error.message}`);
    }

    // Step 5: Test getting specific order details
    if (testOrderId) {
      console.log('\n5. Testing get order by ID...');
      try {
        const orderResponse = await axios.get(`${API_BASE}/orders/${testOrderId}`, {
          headers: {
            'Cookie': `token-banhmi=${authToken}`
          }
        });

        if (orderResponse.status === 200) {
          addResult(`/orders/${testOrderId}`, 'GET', 'PASS', 'Successfully retrieved order details', {
            orderId: orderResponse.data.order._id,
            status: orderResponse.data.order.status,
            itemsCount: orderResponse.data.order.items.length
          });
        }
      } catch (error: any) {
        addResult(`/orders/${testOrderId}`, 'GET', 'FAIL', `Failed to get order details: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 6: Test order creation with insufficient stock
    console.log('\n6. Testing order creation with insufficient stock...');
    try {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 9999, // Intentionally high quantity
            selectedOptions: []
          }
        ],
        paymentType: '代引き'
      };

      await axios.post(`${API_BASE}/orders`, orderData, {
        headers: {
          'Cookie': `token-banhmi=${authToken}`
        }
      });

      addResult('/orders', 'POST', 'FAIL', 'Should have failed with insufficient stock error');
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Insufficient stock')) {
        addResult('/orders', 'POST', 'PASS', 'Correctly rejected order with insufficient stock');
      } else {
        addResult('/orders', 'POST', 'FAIL', `Unexpected error: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 7: Test point payment validation (should fail for non-approved buyer)
    console.log('\n7. Testing point payment validation...');
    try {
      const orderData = {
        items: [
          {
            productId: testProductId,
            quantity: 1,
            selectedOptions: []
          }
        ],
        paymentType: 'ポイント'
      };

      await axios.post(`${API_BASE}/orders`, orderData, {
        headers: {
          'Cookie': `token-banhmi=${authToken}`
        }
      });

      addResult('/orders', 'POST', 'FAIL', 'Should have failed with approval required error');
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('pending approval')) {
        addResult('/orders', 'POST', 'PASS', 'Correctly rejected point payment for non-approved buyer');
      } else {
        addResult('/orders', 'POST', 'FAIL', `Unexpected error: ${error.response?.data?.message || error.message}`);
      }
    }

    // Step 8: Test invalid order data
    console.log('\n8. Testing invalid order data validation...');
    try {
      const orderData = {
        items: [], // Empty items array
        paymentType: '代引き'
      };

      await axios.post(`${API_BASE}/orders`, orderData, {
        headers: {
          'Cookie': `token-banhmi=${authToken}`
        }
      });

      addResult('/orders', 'POST', 'FAIL', 'Should have failed with empty items validation error');
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Order items are required')) {
        addResult('/orders', 'POST', 'PASS', 'Correctly rejected order with empty items');
      } else {
        addResult('/orders', 'POST', 'FAIL', `Unexpected error: ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('Test execution error:', error);
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${((passCount / results.length) * 100).toFixed(1)}%`);

  if (failCount > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   ${result.method} ${result.endpoint}: ${result.message}`);
    });
  }

  return results;
};

// Run tests if this file is executed directly
if (require.main === module) {
  testOrderEndpoints().catch(console.error);
}

export { testOrderEndpoints };