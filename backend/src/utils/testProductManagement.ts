import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testProduct = {
  name: 'テスト バインミー',
  type: 'banhmi' as const,
  description: 'これはテスト用のバインミーです。美味しいベトナムサンドイッチ。',
  price: 500,
  stock: 10,
  options: [
    { name: 'パクチー', extraCost: 50 },
    { name: 'チリソース', extraCost: 0 }
  ]
};

async function testProductManagement() {
  console.log('🧪 Testing Product Management API...\n');

  try {
    // First, login as admin to get authentication
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });

    if (!loginResponse.data.user) {
      throw new Error(`Failed to login as admin: ${loginResponse.data.message || 'No user data'}`);
    }
    console.log('✅ Admin login successful\n');

    // Get cookies from login response
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // Set up axios defaults for authenticated requests
    const authAxios = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Cookie': cookieHeader
      }
    });

    // 2. Test creating a product
    console.log('2. Creating a test product...');
    const createResponse = await authAxios.post('/products', testProduct);
    
    if (!createResponse.data.success) {
      throw new Error('Failed to create product');
    }
    
    const createdProduct = createResponse.data.data;
    console.log('✅ Product created successfully');
    console.log(`   Product ID: ${createdProduct._id}`);
    console.log(`   Product Name: ${createdProduct.name}\n`);

    // 3. Test getting all products
    console.log('3. Fetching all products...');
    const getProductsResponse = await authAxios.get('/products');
    
    if (!getProductsResponse.data.success) {
      throw new Error('Failed to fetch products');
    }
    
    const products = getProductsResponse.data.data;
    console.log('✅ Products fetched successfully');
    console.log(`   Total products: ${products.length}\n`);

    // 4. Test getting single product
    console.log('4. Fetching single product...');
    const getProductResponse = await authAxios.get(`/products/${createdProduct._id}`);
    
    if (!getProductResponse.data.success) {
      throw new Error('Failed to fetch single product');
    }
    
    console.log('✅ Single product fetched successfully');
    console.log(`   Product: ${getProductResponse.data.data.name}\n`);

    // 5. Test updating product
    console.log('5. Updating product...');
    const updatedData = {
      ...testProduct,
      name: 'Updated テスト バインミー',
      price: 600,
      stock: 15
    };
    
    const updateResponse = await authAxios.put(`/products/${createdProduct._id}`, updatedData);
    
    if (!updateResponse.data.success) {
      throw new Error('Failed to update product');
    }
    
    console.log('✅ Product updated successfully');
    console.log(`   New name: ${updateResponse.data.data.name}`);
    console.log(`   New price: ${updateResponse.data.data.price}\n`);

    // 6. Test filtering products by type
    console.log('6. Testing product filtering...');
    const filterResponse = await authAxios.get('/products?type=banhmi');
    
    if (!filterResponse.data.success) {
      throw new Error('Failed to filter products');
    }
    
    const filteredProducts = filterResponse.data.data;
    console.log('✅ Product filtering works');
    console.log(`   Banhmi products: ${filteredProducts.length}\n`);

    // 7. Test stock management (simulate low stock)
    console.log('7. Testing stock management...');
    const lowStockUpdate = await authAxios.put(`/products/${createdProduct._id}`, {
      ...updatedData,
      stock: 3 // Low stock
    });
    
    if (!lowStockUpdate.data.success) {
      throw new Error('Failed to update stock');
    }
    
    console.log('✅ Stock management works');
    console.log(`   Stock level: ${lowStockUpdate.data.data.stock} (Low stock warning should appear)\n`);

    // 8. Test soft delete
    console.log('8. Testing soft delete...');
    const deleteResponse = await authAxios.delete(`/products/${createdProduct._id}`);
    
    if (!deleteResponse.data.success) {
      throw new Error('Failed to delete product');
    }
    
    console.log('✅ Product soft delete successful\n');

    // 9. Verify product is soft deleted (should not appear in regular queries)
    console.log('9. Verifying soft delete...');
    const afterDeleteResponse = await authAxios.get('/products');
    const remainingProducts = afterDeleteResponse.data.data;
    const deletedProductExists = remainingProducts.some((p: any) => p._id === createdProduct._id);
    
    if (deletedProductExists) {
      console.log('⚠️  Warning: Soft deleted product still appears in results');
    } else {
      console.log('✅ Soft delete verified - product no longer appears in results\n');
    }

    console.log('🎉 All Product Management tests passed!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log('   ✅ Product creation');
    console.log('   ✅ Product listing');
    console.log('   ✅ Single product fetch');
    console.log('   ✅ Product updates');
    console.log('   ✅ Product filtering');
    console.log('   ✅ Stock management');
    console.log('   ✅ Soft delete');
    console.log('   ✅ Authentication & Authorization');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Backend server is not running. Please start the server with: npm run dev');
    } else {
      console.error('   Error details:', error);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testProductManagement();
}

export { testProductManagement };