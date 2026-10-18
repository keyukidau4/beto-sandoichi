import axios from 'axios';
import { emailLogger } from '../services/emailLoggingService';
import { emailHealthMonitor } from '../services/emailHealthMonitor';

/**
 * Test script for email security and validation implementation
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/admin/email`;

// Test admin credentials (should be set in environment)
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

let authToken: string = '';

/**
 * Authenticate as admin
 */
async function authenticate(): Promise<void> {
  try {
    console.log('🔐 Authenticating as admin...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Authentication successful');
    } else {
      throw new Error('Authentication failed: No token received');
    }
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test rate limiting on bulk email endpoint
 */
async function testRateLimiting(): Promise<void> {
  console.log('\n📊 Testing rate limiting...');
  
  try {
    const requests = [];
    
    // Send 6 requests rapidly (limit is 5 per 15 minutes)
    for (let i = 0; i < 6; i++) {
      requests.push(
        axios.post(`${API_BASE}/send-bulk`, {
          templateId: '507f1f77bcf86cd799439011', // Dummy template ID
          recipientIds: ['507f1f77bcf86cd799439012'] // Dummy recipient ID
        }, {
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true // Don't throw on 4xx/5xx
        })
      );
    }

    const responses = await Promise.all(requests);
    
    let rateLimitedCount = 0;
    responses.forEach((response, index) => {
      if (response.status === 429) {
        rateLimitedCount++;
        console.log(`✅ Request ${index + 1}: Rate limited (${response.status})`);
      } else {
        console.log(`📝 Request ${index + 1}: Status ${response.status} - ${response.data?.message || 'No message'}`);
      }
    });

    if (rateLimitedCount > 0) {
      console.log(`✅ Rate limiting working: ${rateLimitedCount} requests were rate limited`);
    } else {
      console.log('⚠️  Rate limiting may not be working as expected');
    }
  } catch (error: any) {
    console.error('❌ Rate limiting test failed:', error.message);
  }
}

/**
 * Test email address validation
 */
async function testEmailValidation(): Promise<void> {
  console.log('\n📧 Testing email address validation...');
  
  const testCases = [
    {
      name: 'Valid email addresses',
      recipientIds: [], // We'll use empty array to test direct email validation
      recipients: ['test1@example.com', 'test2@example.com'],
      shouldPass: true
    },
    {
      name: 'Invalid email addresses',
      recipientIds: [],
      recipients: ['invalid-email', 'another@invalid', '@invalid.com'],
      shouldPass: false
    },
    {
      name: 'Too many recipients (>10)',
      recipientIds: [],
      recipients: Array(11).fill('test@example.com'),
      shouldPass: false
    },
    {
      name: 'Empty recipients',
      recipientIds: [],
      recipients: [],
      shouldPass: false
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing: ${testCase.name}`);
      
      const response = await axios.post(`${API_BASE}/send-bulk`, {
        templateId: '507f1f77bcf86cd799439011',
        recipientIds: testCase.recipientIds,
        recipients: testCase.recipients
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true
      });

      if (testCase.shouldPass && response.status === 200) {
        console.log('  ✅ Passed as expected');
      } else if (!testCase.shouldPass && response.status >= 400) {
        console.log(`  ✅ Rejected as expected (${response.status}): ${response.data?.message}`);
      } else {
        console.log(`  ⚠️  Unexpected result: Status ${response.status}, Expected to ${testCase.shouldPass ? 'pass' : 'fail'}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Test failed: ${error.message}`);
    }
  }
}

/**
 * Test HTML content sanitization
 */
async function testContentSanitization(): Promise<void> {
  console.log('\n🧹 Testing HTML content sanitization...');
  
  const testCases = [
    {
      name: 'Safe HTML content',
      content: '<p>Hello <strong>{{name}}</strong>!</p><br><a href="https://example.com">Link</a>',
      shouldPass: true
    },
    {
      name: 'Script injection attempt',
      content: '<p>Hello {{name}}</p><script>alert("xss")</script>',
      shouldPass: false
    },
    {
      name: 'JavaScript protocol',
      content: '<p><a href="javascript:alert(\'xss\')">Click me</a></p>',
      shouldPass: false
    },
    {
      name: 'Event handler injection',
      content: '<p onclick="alert(\'xss\')">Click me</p>',
      shouldPass: false
    },
    {
      name: 'Form elements',
      content: '<form><input type="text" name="test"></form>',
      shouldPass: false
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing: ${testCase.name}`);
      
      const response = await axios.post(`${API_BASE}/templates`, {
        title: `Test Template - ${testCase.name}`,
        content: testCase.content,
        type: 'general'
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true
      });

      if (testCase.shouldPass && response.status === 201) {
        console.log('  ✅ Safe content accepted');
        // Clean up - delete the created template
        if (response.data?.data?._id) {
          await axios.delete(`${API_BASE}/templates/${response.data.data._id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
        }
      } else if (!testCase.shouldPass && response.status >= 400) {
        console.log(`  ✅ Dangerous content rejected (${response.status}): ${response.data?.message}`);
      } else {
        console.log(`  ⚠️  Unexpected result: Status ${response.status}, Expected to ${testCase.shouldPass ? 'pass' : 'fail'}`);
        console.log(`  Response: ${JSON.stringify(response.data, null, 2)}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Test failed: ${error.message}`);
    }
  }
}

/**
 * Test authentication and authorization
 */
async function testAuthentication(): Promise<void> {
  console.log('\n🔒 Testing authentication and authorization...');
  
  try {
    // Test without token
    console.log('  Testing request without authentication token...');
    const noAuthResponse = await axios.get(`${API_BASE}/templates`, {
      validateStatus: () => true
    });
    
    if (noAuthResponse.status === 401) {
      console.log('  ✅ Unauthenticated request rejected');
    } else {
      console.log(`  ⚠️  Unexpected status for unauthenticated request: ${noAuthResponse.status}`);
    }

    // Test with invalid token
    console.log('  Testing request with invalid token...');
    const invalidTokenResponse = await axios.get(`${API_BASE}/templates`, {
      headers: { Authorization: 'Bearer invalid-token' },
      validateStatus: () => true
    });
    
    if (invalidTokenResponse.status === 401) {
      console.log('  ✅ Invalid token rejected');
    } else {
      console.log(`  ⚠️  Unexpected status for invalid token: ${invalidTokenResponse.status}`);
    }

    // Test with valid token
    console.log('  Testing request with valid admin token...');
    const validTokenResponse = await axios.get(`${API_BASE}/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });
    
    if (validTokenResponse.status === 200) {
      console.log('  ✅ Valid admin token accepted');
    } else {
      console.log(`  ⚠️  Unexpected status for valid token: ${validTokenResponse.status}`);
    }
  } catch (error: any) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

/**
 * Test email service health monitoring
 */
async function testHealthMonitoring(): Promise<void> {
  console.log('\n🏥 Testing email service health monitoring...');
  
  try {
    // Test health endpoint
    console.log('  Testing health check endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });
    
    if (healthResponse.status === 200) {
      console.log('  ✅ Health check endpoint accessible');
      console.log(`  📊 Service status: ${healthResponse.data?.data?.status}`);
      console.log(`  📊 SMTP connected: ${healthResponse.data?.data?.smtpConnected}`);
      console.log(`  📊 Circuit breaker: ${healthResponse.data?.data?.circuitBreaker?.state}`);
    } else {
      console.log(`  ⚠️  Health check failed with status: ${healthResponse.status}`);
    }

    // Test metrics endpoint
    console.log('  Testing metrics endpoint...');
    const metricsResponse = await axios.get(`${API_BASE}/metrics`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });
    
    if (metricsResponse.status === 200) {
      console.log('  ✅ Metrics endpoint accessible');
      const metrics = metricsResponse.data?.data?.metrics;
      if (metrics) {
        console.log(`  📊 Total emails sent: ${metrics.totalEmailsSent}`);
        console.log(`  📊 Total emails failed: ${metrics.totalEmailsFailed}`);
        console.log(`  📊 Success rate: ${metrics.successRate}%`);
      }
    } else {
      console.log(`  ⚠️  Metrics check failed with status: ${metricsResponse.status}`);
    }
  } catch (error: any) {
    console.error('❌ Health monitoring test failed:', error.message);
  }
}

/**
 * Test error handling and logging
 */
async function testErrorHandling(): Promise<void> {
  console.log('\n🚨 Testing error handling and logging...');
  
  try {
    // Test with non-existent template
    console.log('  Testing non-existent template error...');
    const response = await axios.get(`${API_BASE}/templates/507f1f77bcf86cd799439999`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });
    
    if (response.status === 404) {
      console.log('  ✅ Non-existent template properly handled');
      console.log(`  📝 Error code: ${response.data?.code}`);
      console.log(`  📝 Error message: ${response.data?.message}`);
    } else {
      console.log(`  ⚠️  Unexpected status for non-existent template: ${response.status}`);
    }

    // Test invalid ObjectId
    console.log('  Testing invalid ObjectId error...');
    const invalidIdResponse = await axios.get(`${API_BASE}/templates/invalid-id`, {
      headers: { Authorization: `Bearer ${authToken}` },
      validateStatus: () => true
    });
    
    if (invalidIdResponse.status === 400) {
      console.log('  ✅ Invalid ObjectId properly handled');
    } else {
      console.log(`  ⚠️  Unexpected status for invalid ObjectId: ${invalidIdResponse.status}`);
    }
  } catch (error: any) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runSecurityTests(): Promise<void> {
  console.log('🔒 Starting Email Security and Validation Tests');
  console.log('================================================');
  
  try {
    await authenticate();
    
    await testAuthentication();
    await testRateLimiting();
    await testEmailValidation();
    await testContentSanitization();
    await testHealthMonitoring();
    await testErrorHandling();
    
    console.log('\n✅ Email security tests completed');
    console.log('================================================');
    
    // Display some logging statistics
    console.log('\n📊 Logging Statistics:');
    const metrics = emailLogger.getMetrics();
    console.log(`Total emails sent: ${metrics.totalEmailsSent}`);
    console.log(`Total emails failed: ${metrics.totalEmailsFailed}`);
    console.log(`Success rate: ${metrics.successRate}%`);
    console.log(`Recent errors: ${metrics.recentErrors.length}`);
    
    console.log('\n🏥 Health Monitor Status:');
    const healthStatus = emailHealthMonitor.getHealthStatus();
    console.log(`Service status: ${healthStatus.status}`);
    console.log(`Consecutive failures: ${healthStatus.consecutiveFailures}`);
    console.log(`SMTP connected: ${healthStatus.smtpConnected}`);
    console.log(`Circuit breaker: ${emailHealthMonitor.getCircuitBreakerState().state}`);
    
  } catch (error: any) {
    console.error('❌ Security tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityTests().catch(console.error);
}

export { runSecurityTests };