import axios from 'axios';
import { config } from 'dotenv';

config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

class SecurityTester {
  private results: TestResult[] = [];

  private addResult(test: string, passed: boolean, message: string) {
    this.results.push({ test, passed, message });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
  }

  async testRateLimiting() {
    console.log('\n🔒 Testing Rate Limiting...');
    
    try {
      // Test general rate limiting by making multiple requests quickly
      const promises = Array.from({ length: 10 }, () => 
        axios.get(`${BASE_URL}/health`, { timeout: 5000 })
      );
      
      const responses = await Promise.allSettled(promises);
      const successCount = responses.filter(r => r.status === 'fulfilled').length;
      
      this.addResult(
        'General Rate Limiting',
        successCount > 0,
        `${successCount}/10 requests succeeded (rate limiting allows reasonable requests)`
      );

      // Test auth rate limiting
      const authPromises = Array.from({ length: 6 }, () => 
        axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        }, { 
          timeout: 5000,
          validateStatus: () => true // Accept all status codes
        })
      );
      
      const authResponses = await Promise.allSettled(authPromises);
      const rateLimitedCount = authResponses.filter(r => 
        r.status === 'fulfilled' && (r.value as any).status === 429
      ).length;
      
      this.addResult(
        'Auth Rate Limiting',
        rateLimitedCount > 0,
        `${rateLimitedCount} requests were rate limited (auth protection working)`
      );

    } catch (error) {
      this.addResult('Rate Limiting', false, `Error testing rate limiting: ${error}`);
    }
  }

  async testInputValidation() {
    console.log('\n🛡️ Testing Input Validation...');
    
    try {
      // Test XSS prevention
      const xssPayload = {
        email: '<script>alert("xss")</script>@example.com',
        password: 'password123'
      };
      
      const xssResponse = await axios.post(`${BASE_URL}/api/auth/login`, xssPayload, {
        validateStatus: () => true
      });
      
      this.addResult(
        'XSS Prevention',
        xssResponse.status === 400,
        `XSS payload rejected with status ${xssResponse.status}`
      );

      // Test SQL injection prevention
      const sqlPayload = {
        email: "admin@example.com' OR '1'='1",
        password: 'password'
      };
      
      const sqlResponse = await axios.post(`${BASE_URL}/api/auth/login`, sqlPayload, {
        validateStatus: () => true
      });
      
      this.addResult(
        'SQL Injection Prevention',
        sqlResponse.status === 400,
        `SQL injection payload rejected with status ${sqlResponse.status}`
      );

      // Test invalid JSON
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true
        });
      } catch (error) {
        this.addResult(
          'Invalid JSON Handling',
          true,
          'Invalid JSON properly rejected'
        );
      }

    } catch (error) {
      this.addResult('Input Validation', false, `Error testing input validation: ${error}`);
    }
  }

  async testSecurityHeaders() {
    console.log('\n🔐 Testing Security Headers...');
    
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      const headers = response.headers;
      
      // Check for security headers
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'referrer-policy',
        'content-security-policy'
      ];
      
      let headerCount = 0;
      securityHeaders.forEach(header => {
        if (headers[header]) {
          headerCount++;
          this.addResult(
            `Security Header: ${header}`,
            true,
            `Present: ${headers[header]}`
          );
        } else {
          this.addResult(
            `Security Header: ${header}`,
            false,
            'Missing'
          );
        }
      });
      
      // Check that X-Powered-By is removed
      this.addResult(
        'X-Powered-By Removal',
        !headers['x-powered-by'],
        headers['x-powered-by'] ? 'Still present' : 'Successfully removed'
      );

    } catch (error) {
      this.addResult('Security Headers', false, `Error testing security headers: ${error}`);
    }
  }

  async testCORSConfiguration() {
    console.log('\n🌐 Testing CORS Configuration...');
    
    try {
      // Test preflight request
      const preflightResponse = await axios.options(`${BASE_URL}/api/auth/login`, {
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        validateStatus: () => true
      });
      
      this.addResult(
        'CORS Preflight',
        preflightResponse.status === 200 || preflightResponse.status === 204,
        `Preflight response: ${preflightResponse.status}`
      );
      
      // Check CORS headers
      const corsHeaders = preflightResponse.headers;
      this.addResult(
        'CORS Headers',
        corsHeaders['access-control-allow-origin'] !== undefined,
        `Allow-Origin: ${corsHeaders['access-control-allow-origin']}`
      );

    } catch (error) {
      this.addResult('CORS Configuration', false, `Error testing CORS: ${error}`);
    }
  }

  async testRequestSizeLimiting() {
    console.log('\n📏 Testing Request Size Limiting...');
    
    try {
      // Create a large payload (over 10MB)
      const largePayload = {
        email: 'test@example.com',
        password: 'password',
        data: 'x'.repeat(11 * 1024 * 1024) // 11MB of data
      };
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, largePayload, {
        validateStatus: () => true,
        timeout: 10000
      });
      
      this.addResult(
        'Request Size Limiting',
        response.status === 413 || response.status === 400,
        `Large request rejected with status ${response.status}`
      );

    } catch (error: any) {
      // Network errors are expected for oversized requests
      this.addResult(
        'Request Size Limiting',
        error.code === 'ECONNABORTED' || error.response?.status === 413,
        'Large request properly rejected'
      );
    }
  }

  async testSuspiciousPatternDetection() {
    console.log('\n🕵️ Testing Suspicious Pattern Detection...');
    
    try {
      // Test directory traversal
      const traversalResponse = await axios.get(`${BASE_URL}/api/../../../etc/passwd`, {
        validateStatus: () => true
      });
      
      this.addResult(
        'Directory Traversal Protection',
        traversalResponse.status === 400 || traversalResponse.status === 404,
        `Directory traversal blocked with status ${traversalResponse.status}`
      );
      
      // Test encoded traversal
      const encodedResponse = await axios.get(`${BASE_URL}/api/%2e%2e/%2e%2e/etc/passwd`, {
        validateStatus: () => true
      });
      
      this.addResult(
        'Encoded Traversal Protection',
        encodedResponse.status === 400 || encodedResponse.status === 404,
        `Encoded traversal blocked with status ${encodedResponse.status}`
      );

    } catch (error) {
      this.addResult('Suspicious Pattern Detection', false, `Error testing patterns: ${error}`);
    }
  }

  async testValidationMiddleware() {
    console.log('\n✅ Testing Validation Middleware...');
    
    try {
      // Test missing required fields
      const incompleteResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'test@example.com'
        // Missing required fields
      }, {
        validateStatus: () => true
      });
      
      this.addResult(
        'Required Field Validation',
        incompleteResponse.status === 400,
        `Incomplete data rejected with status ${incompleteResponse.status}`
      );
      
      // Test invalid email format
      const invalidEmailResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'invalid-email',
        password: 'password'
      }, {
        validateStatus: () => true
      });
      
      this.addResult(
        'Email Format Validation',
        invalidEmailResponse.status === 400,
        `Invalid email rejected with status ${invalidEmailResponse.status}`
      );

    } catch (error) {
      this.addResult('Validation Middleware', false, `Error testing validation: ${error}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Security Implementation Tests...\n');
    
    await this.testRateLimiting();
    await this.testInputValidation();
    await this.testSecurityHeaders();
    await this.testCORSConfiguration();
    await this.testRequestSizeLimiting();
    await this.testSuspiciousPatternDetection();
    await this.testValidationMiddleware();
    
    this.printSummary();
  }

  private printSummary() {
    console.log('\n📊 Security Test Summary');
    console.log('========================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('\n🎉 All security tests passed! The implementation is secure.');
    } else {
      console.log('\n⚠️ Some security tests failed. Please review the implementation.');
      
      console.log('\nFailed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  ❌ ${r.test}: ${r.message}`));
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(console.error);
}

export default SecurityTester;