import http from 'http';
import { config } from 'dotenv';

config();

const API_BASE = 'localhost';
const API_PORT = process.env.PORT || 5000;

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

const debugOrderCreation = async () => {
  console.log('🔍 Debugging Order Creation...\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginData = JSON.stringify({
      email: 'buyer@test.com',
      password: 'password123'
    });

    const loginResponse = await makeRequest({
      hostname: API_BASE,
      port: API_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);

    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed:', loginResponse.body);
      return;
    }

    const authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
    console.log('✅ Login successful');

    // Step 2: Get products
    console.log('\n2. Getting products...');
    const productsResponse = await makeRequest({
      hostname: API_BASE,
      port: API_PORT,
      path: '/api/products',
      method: 'GET'
    });

    if (productsResponse.statusCode !== 200) {
      console.log('❌ Failed to get products:', productsResponse.body);
      return;
    }

    const products = productsResponse.body.data;
    if (!products || products.length === 0) {
      console.log('❌ No products found');
      return;
    }

    const testProduct = products[0];
    console.log('✅ Found product:', testProduct.name, 'ID:', testProduct._id);

    // Step 3: Create order with detailed logging
    console.log('\n3. Creating order...');
    const orderData = {
      items: [
        {
          productId: testProduct._id,
          quantity: 1,
          selectedOptions: ['パクチー']
        }
      ],
      paymentType: '代引き'
    };

    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const orderDataString = JSON.stringify(orderData);
    const orderResponse = await makeRequest({
      hostname: API_BASE,
      port: API_PORT,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orderDataString),
        'Cookie': authCookie
      }
    }, orderDataString);

    console.log('\nOrder Response:');
    console.log('Status Code:', orderResponse.statusCode);
    console.log('Response Body:', JSON.stringify(orderResponse.body, null, 2));

    if (orderResponse.statusCode === 201) {
      console.log('✅ Order created successfully!');
    } else {
      console.log('❌ Order creation failed');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

if (require.main === module) {
  debugOrderCreation();
}

export default debugOrderCreation;