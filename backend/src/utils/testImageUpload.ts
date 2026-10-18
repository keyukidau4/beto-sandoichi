import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:5000';

/**
 * Test image upload functionality
 */
async function testImageUpload() {
  console.log('🧪 Testing Image Upload Functionality...\n');

  try {
    // First, we need to login as admin to get auth token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });

    if (!loginResponse.data.success) {
      console.log('❌ Admin login failed. Please ensure admin user exists.');
      return;
    }

    console.log('✅ Admin login successful');

    // Get cookies from login response
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Test 2: Upload image
    console.log('\n2. Testing image upload...');
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(`${BASE_URL}/api/upload/image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Cookie': cookieHeader
      }
    });

    if (uploadResponse.data.success) {
      console.log('✅ Image upload successful');
      console.log('📷 Image URL:', uploadResponse.data.data.url);
      console.log('🆔 Public ID:', uploadResponse.data.data.publicId);
      console.log('📏 Dimensions:', `${uploadResponse.data.data.width}x${uploadResponse.data.data.height}`);
      console.log('📦 Size:', uploadResponse.data.data.size, 'bytes');
    } else {
      console.log('❌ Image upload failed:', uploadResponse.data.message);
    }

    // Test 3: Upload without authentication
    console.log('\n3. Testing upload without authentication...');
    try {
      const formData2 = new FormData();
      formData2.append('image', testImageBuffer, {
        filename: 'test-image-2.png',
        contentType: 'image/png'
      });

      await axios.post(`${BASE_URL}/api/upload/image`, formData2, {
        headers: formData2.getHeaders()
      });
      console.log('❌ Upload without auth should have failed');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Upload correctly rejected without authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 4: Upload invalid file type
    console.log('\n4. Testing invalid file type...');
    try {
      const formData3 = new FormData();
      formData3.append('image', Buffer.from('invalid file content'), {
        filename: 'test.txt',
        contentType: 'text/plain'
      });

      await axios.post(`${BASE_URL}/api/upload/image`, formData3, {
        headers: {
          ...formData3.getHeaders(),
          'Cookie': cookieHeader
        }
      });
      console.log('❌ Invalid file type should have been rejected');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid file type correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Image upload tests completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testImageUpload();
}

export default testImageUpload;