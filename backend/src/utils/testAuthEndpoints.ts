import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/auth';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  tel: '090-1234-5678',
  zip1: '123',
  zip2: '4567',
  address1: 'Tokyo',
  address2: 'Shibuya'
};

const testLogin = {
  email: 'test@example.com',
  password: 'password123'
};

// Store cookies for authenticated requests
let cookies: string = '';

const testAuthEndpoints = async () => {
  try {
    console.log('🧪 Testing Authentication Endpoints...\n');

    // Test 1: Register endpoint
    console.log('1. Testing POST /api/auth/register');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/register`, testUser, {
        withCredentials: true
      });
      
      console.log('✅ Registration successful');
      console.log('Status:', registerResponse.status);
      console.log('Response:', registerResponse.data);
      
      // Extract cookies from response
      if (registerResponse.headers['set-cookie']) {
        cookies = registerResponse.headers['set-cookie'].join('; ');
        console.log('🍪 Cookies set:', cookies);
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('⚠️  User already exists, continuing with login test...');
      } else {
        console.error('❌ Registration failed:', error.response?.data || error.message);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Login endpoint
    console.log('2. Testing POST /api/auth/login');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/login`, testLogin, {
        withCredentials: true
      });
      
      console.log('✅ Login successful');
      console.log('Status:', loginResponse.status);
      console.log('Response:', loginResponse.data);
      
      // Extract cookies from response
      if (loginResponse.headers['set-cookie']) {
        cookies = loginResponse.headers['set-cookie'].join('; ');
        console.log('🍪 Cookies set:', cookies);
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      return;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get current user endpoint (protected)
    console.log('3. Testing GET /api/auth/me (protected)');
    try {
      const meResponse = await axios.get(`${BASE_URL}/me`, {
        headers: {
          Cookie: cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Get current user successful');
      console.log('Status:', meResponse.status);
      console.log('Response:', meResponse.data);
    } catch (error: any) {
      console.error('❌ Get current user failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Logout endpoint
    console.log('4. Testing POST /api/auth/logout');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/logout`, {}, {
        headers: {
          Cookie: cookies
        },
        withCredentials: true
      });
      
      console.log('✅ Logout successful');
      console.log('Status:', logoutResponse.status);
      console.log('Response:', logoutResponse.data);
    } catch (error: any) {
      console.error('❌ Logout failed:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Try accessing protected endpoint after logout
    console.log('5. Testing GET /api/auth/me after logout (should fail)');
    try {
      const meAfterLogoutResponse = await axios.get(`${BASE_URL}/me`, {
        withCredentials: true
      });
      
      console.log('❌ Unexpected success - should have failed after logout');
      console.log('Response:', meAfterLogoutResponse.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected - user not authenticated after logout');
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else {
        console.error('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Authentication endpoint testing completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
};

// Test validation errors
const testValidationErrors = async () => {
  console.log('\n🧪 Testing Validation Errors...\n');

  // Test invalid registration data
  console.log('1. Testing registration with invalid data');
  try {
    const invalidUser = {
      email: 'invalid-email',
      password: '123', // too short
      name: '',
      tel: 'invalid-phone',
      zip1: '12', // too short
      zip2: '12345', // too long
      address1: '',
      address2: ''
    };

    await axios.post(`${BASE_URL}/register`, invalidUser);
    console.log('❌ Should have failed validation');
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('✅ Validation errors caught correctly');
      console.log('Errors:', error.response.data.errors);
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test invalid login data
  console.log('\n2. Testing login with invalid data');
  try {
    const invalidLogin = {
      email: 'invalid-email',
      password: ''
    };

    await axios.post(`${BASE_URL}/login`, invalidLogin);
    console.log('❌ Should have failed validation');
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.log('✅ Validation errors caught correctly');
      console.log('Errors:', error.response.data.errors);
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Authentication API Tests\n');
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testAuthEndpoints();
  await testValidationErrors();
  
  console.log('\n✨ All tests completed!');
  process.exit(0);
};

if (require.main === module) {
  runTests();
}

export { testAuthEndpoints, testValidationErrors };