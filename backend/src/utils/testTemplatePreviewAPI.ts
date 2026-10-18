/**
 * Test script for email template preview API endpoint
 */

import axios from 'axios';
import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import { User } from '../models/User';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

const testTemplatePreviewAPI = async () => {
  try {
    console.log('🧪 Testing Email Template Preview API Endpoint...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banhmi-app');
    console.log('✅ Connected to database');

    // Get admin user for authentication
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please create an admin user first.');
    }

    // Login to get admin token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: adminUser.email,
      password: 'admin123' // Assuming default admin password
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Create a test template
    console.log('📝 Creating test template...');
    const templateData = {
      title: 'API Test Preview Template',
      content: `
        <h2>こんにちは、{{name}}様</h2>
        <p>{{systemName}}からのお知らせです。</p>
        <p>現在のポイント: {{point}}ポイント</p>
        <p>メールアドレス: {{email}}</p>
        <p>日付: {{currentDate}}</p>
        <p>注文番号: {{orderNumber}}</p>
        <p>合計金額: {{totalAmount}}円</p>
        <p>注文状況: {{orderStatus}}</p>
        <p>無効なプレースホルダー: {{invalidPlaceholder}}</p>
      `,
      type: 'general'
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/email/templates`,
      templateData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const templateId = createResponse.data.data._id;
    console.log('✅ Test template created with ID:', templateId);

    // Test 1: Preview the template
    console.log('\n🎨 Test 1: Template Preview API');
    const previewResponse = await axios.post(
      `${API_BASE_URL}/admin/email/templates/${templateId}/preview`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Preview API Response Status:', previewResponse.status);
    console.log('Preview API Response Data:');
    console.log(JSON.stringify(previewResponse.data, null, 2));

    // Test 2: Preview non-existent template
    console.log('\n❌ Test 2: Preview Non-existent Template');
    try {
      await axios.post(
        `${API_BASE_URL}/admin/email/templates/507f1f77bcf86cd799439011/preview`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      console.log('Expected error for non-existent template:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // Test 3: Preview without authentication
    console.log('\n🔒 Test 3: Preview Without Authentication');
    try {
      await axios.post(
        `${API_BASE_URL}/admin/email/templates/${templateId}/preview`,
        {}
      );
    } catch (error: any) {
      console.log('Expected error for unauthenticated request:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // Test 4: Preview with invalid template ID
    console.log('\n🔍 Test 4: Preview With Invalid Template ID');
    try {
      await axios.post(
        `${API_BASE_URL}/admin/email/templates/invalid-id/preview`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      console.log('Expected error for invalid template ID:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
    }

    // Clean up test template
    await axios.delete(
      `${API_BASE_URL}/admin/email/templates/${templateId}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    console.log('\n🧹 Test template cleaned up');

    console.log('\n✅ All API tests completed successfully!');

  } catch (error: any) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testTemplatePreviewAPI();
}

export { testTemplatePreviewAPI };