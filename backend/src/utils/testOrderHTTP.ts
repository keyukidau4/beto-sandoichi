import http from 'http';
import { config } from 'dotenv';

config();

const API_BASE = 'localhost';
const API_PORT = process.env.PORT || 5000;

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

const results: TestResult[] = [];

// Helper function to make HTTP requests
const makeRequest = (options: any, data?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
};

// Helper function to add test result
const addResult = (endpoint: string, method: string, status: 'PASS' | 'FAIL', message: string) => {
  results.push({ endpoint, method, status, message });
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${method} ${endpoint}: ${message}`);
};

const testOrderHTTP = async () => {
  console.log('🧪 Testing Order HTTP Endpoints...\n');

  let authCookie = '';

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
      const response = await makeRequest({
        hostname: API_BASE,
        port: API_PORT,
        path: '/health',
        method: 'GET'
      });

      if (response.statusCode === 200) {
        addResult('/health', 'GET', 'PASS', 'Server is running');
      } else {
        addResult('/health', 'GET', 'FAIL', `Unexpected status: ${response.statusCode}`);
      }
    } catch (error: any) {
      addResult('/health', 'GET', 'FAIL', `Connection failed: ${error.message}`);
      console.log('❌ Server is not running. Please start the server first.');
      return;
    }

    // Test 2: Login as buyer
    console.log('\n2. Testing buyer login...');
    try {
      const loginData = JSON.stringify({
        email: 'buyer@test.com',
        password: 'password123'
      });

      const response = await makeRequest({
        hostname: API_BASE,
        port: API_PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      }, loginData);

      if (response.statusCode === 200) {
        // Extract cookie from Set-Cookie header
        const setCookie = response.headers['set-cookie'];
        if (setCookie && setCookie[0]) {
          authCookie = setCookie[0].split(';')[0];
          addResult('/api/auth/login', 'POST', 'PASS', 'Login successful');
        } else {
          addResult('/api/auth/login', 'POST', 'FAIL', 'No auth cookie received');
        }
      } else {
        addResult('/api/auth/login', 'POST', 'FAIL', `Login failed: ${response.statusCode} - ${response.body.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      addResult('/api/auth/login', 'POST', 'FAIL', `Login request failed: ${error.message}`);
    }

    if (!authCookie) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    // Test 3: Get user orders
    console.log('\n3. Testing get user orders...');
    try {
      const response = await makeRequest({
        hostname: API_BASE,
        port: API_PORT,
        path: '/api/orders',
        method: 'GET',
        headers: {
          'Cookie': authCookie
        }
      });

      if (response.statusCode === 200) {
        const orders = response.body.orders || [];
        addResult('/api/orders', 'GET', 'PASS', `Retrieved ${orders.length} orders`);
      } else {
        addResult('/api/orders', 'GET', 'FAIL', `Failed: ${response.statusCode} - ${response.body.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      addResult('/api/orders', 'GET', 'FAIL', `Request failed: ${error.message}`);
    }

    // Test 4: Create order with COD
    console.log('\n4. Testing order creation with COD...');
    try {
      // First get a product ID
      const productsResponse = await makeRequest({
        hostname: API_BASE,
        port: API_PORT,
        path: '/api/products',
        method: 'GET'
      });

      if (productsResponse.statusCode !== 200 || !productsResponse.body.data || productsResponse.body.data.length === 0) {
        addResult('/api/orders', 'POST', 'FAIL', 'No products available for testing');
      } else {
        const testProduct = productsResponse.body.data[0];
        
        const orderData = JSON.stringify({
          items: [
            {
              productId: testProduct._id,
              quantity: 1,
              selectedOptions: ['パクチー']
            }
          ],
          paymentType: '代引き'
        });

        const response = await makeRequest({
          hostname: API_BASE,
          port: API_PORT,
          path: '/api/orders',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(orderData),
            'Cookie': authCookie
          }
        }, orderData);

        if (response.statusCode === 201) {
          addResult('/api/orders', 'POST', 'PASS', `Order created successfully - Total: ¥${response.body.order.totalAmount}`);
        } else {
          addResult('/api/orders', 'POST', 'FAIL', `Failed: ${response.statusCode} - ${response.body.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      addResult('/api/orders', 'POST', 'FAIL', `Request failed: ${error.message}`);
    }

    // Test 5: Test point payment (should fail for pending buyer)
    console.log('\n5. Testing point payment validation...');
    try {
      const productsResponse = await makeRequest({
        hostname: API_BASE,
        port: API_PORT,
        path: '/api/products',
        method: 'GET'
      });

      if (productsResponse.statusCode === 200 && productsResponse.body.data && productsResponse.body.data.length > 0) {
        const testProduct = productsResponse.body.data[0];
        
        const orderData = JSON.stringify({
          items: [
            {
              productId: testProduct._id,
              quantity: 1,
              selectedOptions: []
            }
          ],
          paymentType: 'ポイント'
        });

        const response = await makeRequest({
          hostname: API_BASE,
          port: API_PORT,
          path: '/api/orders',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(orderData),
            'Cookie': authCookie
          }
        }, orderData);

        if (response.statusCode === 403 && response.body.message && response.body.message.includes('pending approval')) {
          addResult('/api/orders', 'POST', 'PASS', 'Correctly rejected point payment for pending buyer');
        } else {
          addResult('/api/orders', 'POST', 'FAIL', `Expected 403 error, got: ${response.statusCode} - ${response.body.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      addResult('/api/orders', 'POST', 'FAIL', `Request failed: ${error.message}`);
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
  testOrderHTTP().catch(console.error);
}

export { testOrderHTTP };