import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testProduct = {
  name: 'Bánh Mì Thịt Nướng',
  type: 'banhmi',
  description: 'Delicious grilled pork banh mi with fresh vegetables',
  price: 350,
  stock: 20,
  options: [
    { name: 'パクチー', extraCost: 50 },
    { name: 'チリソース', extraCost: 0 }
  ]
};

let authToken = '';
let productId = '';

// Helper function to make authenticated requests
const makeAuthRequest = (method: string, url: string, data?: any) => {
  return axios({
    method,
    url: `${BASE_URL}${url}`,
    data,
    headers: {
      'Cookie': `token-banhmi=${authToken}`
    },
    withCredentials: true
  });
};

async function testProductEndpoints() {
  console.log('🧪 Testing Product API Endpoints...\n');

  try {
    // Step 1: Test GET /api/products (public endpoint)
    console.log('1. Testing GET /api/products (public)...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    console.log(`✅ Status: ${productsResponse.status}`);
    console.log(`📦 Found ${productsResponse.data.data.length} products`);
    console.log(`📄 Pagination: ${JSON.stringify(productsResponse.data.pagination)}\n`);

    // Step 2: Test GET /api/products with type filter
    console.log('2. Testing GET /api/products?type=banhmi...');
    const filteredResponse = await axios.get(`${BASE_URL}/products?type=banhmi`);
    console.log(`✅ Status: ${filteredResponse.status}`);
    console.log(`🥖 Found ${filteredResponse.data.data.length} banh mi products\n`);

    // Step 3: Test GET /api/products/:id (if products exist)
    if (productsResponse.data.data.length > 0) {
      const firstProduct = productsResponse.data.data[0];
      console.log(`3. Testing GET /api/products/${firstProduct._id}...`);
      const productResponse = await axios.get(`${BASE_URL}/products/${firstProduct._id}`);
      console.log(`✅ Status: ${productResponse.status}`);
      console.log(`📝 Product: ${productResponse.data.data.name}\n`);
    }

    // Step 4: Test POST /api/products (requires admin auth)
    console.log('4. Testing POST /api/products (without auth - should fail)...');
    try {
      await axios.post(`${BASE_URL}/products`, testProduct);
      console.log('❌ Should have failed without authentication');
    } catch (error: any) {
      console.log(`✅ Correctly rejected: ${error.response?.status} - ${error.response?.data?.message}\n`);
    }

    // Step 5: Test PUT /api/products/:id (requires admin auth)
    if (productsResponse.data.data.length > 0) {
      const firstProduct = productsResponse.data.data[0];
      console.log(`5. Testing PUT /api/products/${firstProduct._id} (without auth - should fail)...`);
      try {
        await axios.put(`${BASE_URL}/products/${firstProduct._id}`, { ...testProduct, name: 'Updated Name' });
        console.log('❌ Should have failed without authentication');
      } catch (error: any) {
        console.log(`✅ Correctly rejected: ${error.response?.status} - ${error.response?.data?.message}\n`);
      }
    }

    // Step 6: Test DELETE /api/products/:id (requires admin auth)
    if (productsResponse.data.data.length > 0) {
      const firstProduct = productsResponse.data.data[0];
      console.log(`6. Testing DELETE /api/products/${firstProduct._id} (without auth - should fail)...`);
      try {
        await axios.delete(`${BASE_URL}/products/${firstProduct._id}`);
        console.log('❌ Should have failed without authentication');
      } catch (error: any) {
        console.log(`✅ Correctly rejected: ${error.response?.status} - ${error.response?.data?.message}\n`);
      }
    }

    // Step 7: Test invalid product ID format
    console.log('7. Testing invalid product ID format...');
    try {
      await axios.get(`${BASE_URL}/products/invalid-id`);
      console.log('❌ Should have failed with invalid ID');
    } catch (error: any) {
      console.log(`✅ Correctly rejected invalid ID: ${error.response?.status} - ${error.response?.data?.message}\n`);
    }

    // Step 8: Test non-existent product
    console.log('8. Testing non-existent product...');
    try {
      await axios.get(`${BASE_URL}/products/507f1f77bcf86cd799439011`);
      console.log('❌ Should have failed with not found');
    } catch (error: any) {
      console.log(`✅ Correctly returned not found: ${error.response?.status} - ${error.response?.data?.message}\n`);
    }

    console.log('🎉 Product API endpoint tests completed!');
    console.log('📝 Note: Admin-only endpoints (POST, PUT, DELETE) require authentication');
    console.log('🔐 To test admin endpoints, first authenticate as an admin user');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testProductEndpoints();
}

export { testProductEndpoints };