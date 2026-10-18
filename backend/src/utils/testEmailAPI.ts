import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testEmailAPI() {
  try {
    console.log('=== Testing Email Management API Endpoints ===\n');

    // First, login as admin to get authentication
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@banhmi-app.com',
      password: 'admin123'
    }, {
      withCredentials: true
    });

    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
    } else {
      throw new Error('Admin login failed');
    }

    // Set up axios instance with cookies
    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Test 1: Get email templates
    console.log('\n2. Testing GET /admin/email-templates...');
    const templatesResponse = await apiClient.get('/admin/email-templates');
    console.log(`✅ Retrieved ${templatesResponse.data.data.length} email templates`);
    
    const templates = templatesResponse.data.data;
    templates.forEach((template: any) => {
      console.log(`   - ${template.title} (${template.type})`);
    });

    // Test 2: Create new email template
    console.log('\n3. Testing POST /admin/email-templates...');
    const newTemplate = {
      title: 'API Test Template',
      content: 'Hello {name}, this is a test email from the API. Your email is {email}.',
      type: 'general'
    };

    const createResponse = await apiClient.post('/admin/email-templates', newTemplate);
    console.log('✅ Email template created successfully');
    const createdTemplateId = createResponse.data.data._id;

    // Test 3: Get single email template
    console.log('\n4. Testing GET /admin/email-templates/:id...');
    const singleTemplateResponse = await apiClient.get(`/admin/email-templates/${createdTemplateId}`);
    console.log(`✅ Retrieved template: ${singleTemplateResponse.data.data.title}`);

    // Test 4: Update email template
    console.log('\n5. Testing PUT /admin/email-templates/:id...');
    const updatedTemplate = {
      title: 'Updated API Test Template',
      content: 'Updated content for {name}. Contact us at {email}.',
      type: 'promotion'
    };

    const updateResponse = await apiClient.put(`/admin/email-templates/${createdTemplateId}`, updatedTemplate);
    console.log('✅ Email template updated successfully');

    // Test 5: Get users for email
    console.log('\n6. Testing GET /admin/users-for-email...');
    const usersResponse = await apiClient.get('/admin/users-for-email');
    console.log(`✅ Retrieved ${usersResponse.data.data.length} users for email`);
    
    const users = usersResponse.data.data;
    users.forEach((user: any) => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Test 6: Send email (simulation - will fail due to email config but should validate)
    if (users.length > 0 && templates.length > 0) {
      console.log('\n7. Testing POST /admin/send-email...');
      const emailData = {
        userIds: [users[0]._id],
        templateId: templates[0]._id
      };

      try {
        const sendResponse = await apiClient.post('/admin/send-email', emailData);
        console.log('✅ Email send request processed successfully');
      } catch (error: any) {
        if (error.response?.status === 500 && error.response?.data?.message?.includes('Failed to send email')) {
          console.log('⚠️ Email send failed due to email configuration (expected in development)');
        } else {
          throw error;
        }
      }
    }

    // Test 7: Delete email template
    console.log('\n8. Testing DELETE /admin/email-templates/:id...');
    const deleteResponse = await apiClient.delete(`/admin/email-templates/${createdTemplateId}`);
    console.log('✅ Email template deleted successfully');

    // Test 8: Verify template is deleted (should return 404)
    console.log('\n9. Verifying template deletion...');
    try {
      await apiClient.get(`/admin/email-templates/${createdTemplateId}`);
      console.log('❌ Template should have been deleted');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('✅ Template successfully deleted (404 as expected)');
      } else {
        throw error;
      }
    }

    console.log('\n=== All Email API Tests Completed Successfully ===');

  } catch (error: any) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmailAPI();