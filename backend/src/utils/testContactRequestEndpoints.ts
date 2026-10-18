import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test contact request endpoints
async function testContactRequestEndpoints() {
  console.log('🧪 Testing Contact Request Endpoints...\n');

  try {
    // First, login as a buyer to get authentication
    console.log('1. Logging in as buyer...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'buyer@example.com',
      password: 'password123'
    }, {
      withCredentials: true
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      
      // Get cookies from login response
      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.join('; ') : '';

      // Test creating a contact request
      console.log('\n2. Creating contact request...');
      const createResponse = await axios.post(`${BASE_URL}/users/contact`, {
        type: 'update-info',
        content: 'プロフィール情報を変更したいです。住所を更新してください。'
      }, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });

      if (createResponse.data.success) {
        console.log('✅ Contact request created successfully');
        console.log('Contact Request ID:', createResponse.data.data._id);

        // Test getting user's contact requests
        console.log('\n3. Getting user contact requests...');
        const getUserRequestsResponse = await axios.get(`${BASE_URL}/users/contact`, {
          headers: {
            'Cookie': cookieHeader
          },
          withCredentials: true
        });

        if (getUserRequestsResponse.data.success) {
          console.log('✅ User contact requests retrieved successfully');
          console.log('Number of requests:', getUserRequestsResponse.data.data.length);
        } else {
          console.log('❌ Failed to get user contact requests:', getUserRequestsResponse.data.message);
        }

        // Now test admin endpoints - login as admin
        console.log('\n4. Logging in as admin...');
        const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'admin@example.com',
          password: 'admin123'
        }, {
          withCredentials: true
        });

        if (adminLoginResponse.data.success) {
          console.log('✅ Admin login successful');
          
          const adminCookies = adminLoginResponse.headers['set-cookie'];
          const adminCookieHeader = adminCookies ? adminCookies.join('; ') : '';

          // Test getting all contact requests (admin)
          console.log('\n5. Getting all contact requests (admin)...');
          const getAllRequestsResponse = await axios.get(`${BASE_URL}/users/admin/contact`, {
            headers: {
              'Cookie': adminCookieHeader
            },
            withCredentials: true
          });

          if (getAllRequestsResponse.data.success) {
            console.log('✅ All contact requests retrieved successfully');
            console.log('Total requests:', getAllRequestsResponse.data.data.length);

            // Test updating a contact request
            const requestId = createResponse.data.data._id;
            console.log('\n6. Updating contact request...');
            const updateResponse = await axios.put(`${BASE_URL}/users/contact/${requestId}`, {
              adminResponse: 'プロフィール情報を確認いたします。新しい住所をお教えください。',
              status: 'done'
            }, {
              headers: {
                'Cookie': adminCookieHeader
              },
              withCredentials: true
            });

            if (updateResponse.data.success) {
              console.log('✅ Contact request updated successfully');
              console.log('Updated status:', updateResponse.data.data.status);
            } else {
              console.log('❌ Failed to update contact request:', updateResponse.data.message);
            }
          } else {
            console.log('❌ Failed to get all contact requests:', getAllRequestsResponse.data.message);
          }
        } else {
          console.log('❌ Admin login failed:', adminLoginResponse.data.message);
        }
      } else {
        console.log('❌ Failed to create contact request:', createResponse.data.message);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }

    console.log('\n🎉 Contact request endpoint testing completed!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testContactRequestEndpoints();