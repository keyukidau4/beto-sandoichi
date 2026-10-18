/**
 * Test script for Email Template Management API
 * This script tests all the email template CRUD endpoints
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/admin/email';

// Test data
const testTemplate = {
  title: 'Test Email Template',
  content: '<h2>Hello {{name}}</h2><p>Your current points: {{point}}</p><p>Thank you for using {{systemName}}!</p>',
  type: 'general'
};

const updatedTemplate = {
  title: 'Updated Test Email Template',
  content: '<h2>Hello {{name}}</h2><p>Your email: {{email}}</p><p>Points: {{point}}</p><p>Date: {{currentDate}}</p>',
  type: 'promotion'
};

// Helper function to get admin token (you'll need to implement this based on your auth system)
async function getAdminToken(): Promise<string> {
  // This is a placeholder - you'll need to implement actual admin login
  // For now, return empty string and handle authentication separately
  return '';
}

// Test functions
async function testGetAllTemplates(token: string) {
  console.log('\n🧪 Testing GET /templates...');
  try {
    const response = await axios.get(`${BASE_URL}/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ GET /templates successful');
    console.log('Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.log('❌ GET /templates failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateTemplate(token: string) {
  console.log('\n🧪 Testing POST /templates...');
  try {
    const response = await axios.post(`${BASE_URL}/templates`, testTemplate, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST /templates successful');
    console.log('Response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.log('❌ POST /templates failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetTemplate(token: string, templateId: string) {
  console.log(`\n🧪 Testing GET /templates/${templateId}...`);
  try {
    const response = await axios.get(`${BASE_URL}/templates/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ GET /templates/:id successful');
    console.log('Response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.log('❌ GET /templates/:id failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateTemplate(token: string, templateId: string) {
  console.log(`\n🧪 Testing PUT /templates/${templateId}...`);
  try {
    const response = await axios.put(`${BASE_URL}/templates/${templateId}`, updatedTemplate, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ PUT /templates/:id successful');
    console.log('Response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.log('❌ PUT /templates/:id failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testPreviewTemplate(token: string, templateId: string) {
  console.log(`\n🧪 Testing POST /templates/${templateId}/preview...`);
  try {
    const response = await axios.post(`${BASE_URL}/templates/${templateId}/preview`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST /templates/:id/preview successful');
    console.log('Response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.log('❌ POST /templates/:id/preview failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteTemplate(token: string, templateId: string) {
  console.log(`\n🧪 Testing DELETE /templates/${templateId}...`);
  try {
    const response = await axios.delete(`${BASE_URL}/templates/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ DELETE /templates/:id successful');
    console.log('Response:', response.data);
    return true;
  } catch (error: any) {
    console.log('❌ DELETE /templates/:id failed');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runEmailTemplateTests() {
  console.log('🚀 Starting Email Template API Tests...');
  
  // Get admin token
  const token = await getAdminToken();
  
  // Test 1: Get all templates (should work even if empty)
  await testGetAllTemplates(token);
  
  // Test 2: Create a new template
  const createdTemplate = await testCreateTemplate(token);
  if (!createdTemplate) {
    console.log('❌ Cannot continue tests - template creation failed');
    return;
  }
  
  const templateId = createdTemplate._id;
  console.log(`\n📝 Created template with ID: ${templateId}`);
  
  // Test 3: Get the created template
  await testGetTemplate(token, templateId);
  
  // Test 4: Update the template
  await testUpdateTemplate(token, templateId);
  
  // Test 5: Preview the template
  await testPreviewTemplate(token, templateId);
  
  // Test 6: Get all templates again (should show the created template)
  await testGetAllTemplates(token);
  
  // Test 7: Delete the template
  await testDeleteTemplate(token, templateId);
  
  // Test 8: Verify deletion (should not find the template)
  await testGetTemplate(token, templateId);
  
  console.log('\n🎉 Email Template API Tests Completed!');
}

// Test validation functions
async function testValidation(token: string) {
  console.log('\n🧪 Testing validation...');
  
  // Test invalid template type
  try {
    await axios.post(`${BASE_URL}/templates`, {
      title: 'Invalid Template',
      content: 'Test content',
      type: 'invalid_type'
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.log('✅ Validation correctly rejected invalid template type');
  }
  
  // Test missing required fields
  try {
    await axios.post(`${BASE_URL}/templates`, {
      content: 'Test content'
      // Missing title and type
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.log('✅ Validation correctly rejected missing required fields');
  }
  
  // Test invalid placeholders
  try {
    await axios.post(`${BASE_URL}/templates`, {
      title: 'Invalid Placeholder Template',
      content: 'Hello {{invalidPlaceholder}}',
      type: 'general'
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.log('✅ Validation correctly rejected invalid placeholders');
  }
}

// Export for use in other scripts
export {
  runEmailTemplateTests,
  testValidation,
  testGetAllTemplates,
  testCreateTemplate,
  testGetTemplate,
  testUpdateTemplate,
  testPreviewTemplate,
  testDeleteTemplate
};

// Run tests if this file is executed directly
if (require.main === module) {
  runEmailTemplateTests().catch(console.error);
}