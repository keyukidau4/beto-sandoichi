/**
 * Validation script for Email Template Management implementation
 * This script validates that all the required functionality is properly implemented
 */

import { EmailTemplate } from '../models/EmailTemplate';
import { 
  renderTemplate, 
  extractPlaceholders, 
  validatePlaceholders, 
  getSampleTemplateData,
  renderTemplatePreview,
  AVAILABLE_PLACEHOLDERS 
} from './templateRenderer';
import { validateEmail } from './emailValidator';
import DOMPurify from 'isomorphic-dompurify';

// Test data
const testTemplateData = {
  title: 'Test Email Template',
  content: '<h2>Hello {{name}}</h2><p>Your points: {{point}}</p><p>Email: {{email}}</p><p>Date: {{currentDate}}</p>',
  type: 'general' as const,
  placeholders: ['{{name}}', '{{point}}', '{{email}}', '{{currentDate}}'],
  isDefault: false,
  del_flg: false
};

const maliciousContent = '<script>alert("xss")</script><h2>Hello {{name}}</h2><p>Your points: {{point}}</p>';

async function validateEmailTemplateModel() {
  console.log('\n🧪 Testing EmailTemplate Model...');
  
  try {
    // Test model validation
    const template = new EmailTemplate(testTemplateData);
    const validationError = template.validateSync();
    
    if (validationError) {
      console.log('❌ Model validation failed:', validationError.message);
      return false;
    }
    
    console.log('✅ EmailTemplate model validation passed');
    return true;
  } catch (error) {
    console.log('❌ EmailTemplate model test failed:', error);
    return false;
  }
}

function validateTemplateRenderer() {
  console.log('\n🧪 Testing Template Renderer...');
  
  try {
    // Test placeholder extraction
    const placeholders = extractPlaceholders(testTemplateData.content);
    console.log('Extracted placeholders:', placeholders);
    
    if (placeholders.length !== 4) {
      console.log('❌ Placeholder extraction failed - expected 4, got', placeholders.length);
      return false;
    }
    
    // Test placeholder validation
    const validation = validatePlaceholders(testTemplateData.content);
    if (!validation.valid) {
      console.log('❌ Placeholder validation failed:', validation.invalidPlaceholders);
      return false;
    }
    
    // Test template rendering
    const sampleData = getSampleTemplateData();
    const rendered = renderTemplate(testTemplateData.content, sampleData);
    
    if (rendered.includes('{{')) {
      console.log('❌ Template rendering failed - placeholders not replaced');
      console.log('Rendered content:', rendered);
      return false;
    }
    
    // Test preview rendering
    const preview = renderTemplatePreview(testTemplateData.content);
    if (preview.includes('{{')) {
      console.log('❌ Template preview failed - placeholders not replaced');
      return false;
    }
    
    console.log('✅ Template renderer validation passed');
    console.log('Sample rendered content:', rendered.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.log('❌ Template renderer test failed:', error);
    return false;
  }
}

function validateHtmlSanitization() {
  console.log('\n🧪 Testing HTML Sanitization...');
  
  try {
    // Test XSS prevention
    const sanitized = DOMPurify.sanitize(maliciousContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'style']
    });
    
    if (sanitized.includes('<script>')) {
      console.log('❌ HTML sanitization failed - script tag not removed');
      return false;
    }
    
    if (!sanitized.includes('{{name}}')) {
      console.log('❌ HTML sanitization too aggressive - removed placeholders');
      return false;
    }
    
    console.log('✅ HTML sanitization validation passed');
    console.log('Sanitized content:', sanitized);
    return true;
  } catch (error) {
    console.log('❌ HTML sanitization test failed:', error);
    return false;
  }
}

function validateEmailValidator() {
  console.log('\n🧪 Testing Email Validator...');
  
  try {
    // Test valid emails
    const validEmails = ['test@example.com', 'user@domain.co.jp', 'admin@banhmi-app.com'];
    const invalidEmails = ['invalid-email', '@domain.com', 'user@', ''];
    
    for (const email of validEmails) {
      if (!validateEmail(email)) {
        console.log(`❌ Email validation failed - ${email} should be valid`);
        return false;
      }
    }
    
    for (const email of invalidEmails) {
      if (validateEmail(email)) {
        console.log(`❌ Email validation failed - ${email} should be invalid`);
        return false;
      }
    }
    
    console.log('✅ Email validator validation passed');
    return true;
  } catch (error) {
    console.log('❌ Email validator test failed:', error);
    return false;
  }
}

function validatePlaceholderSystem() {
  console.log('\n🧪 Testing Placeholder System...');
  
  try {
    // Test all available placeholders
    const testContent = Object.keys(AVAILABLE_PLACEHOLDERS).join(' ');
    const sampleData = getSampleTemplateData();
    const rendered = renderTemplate(testContent, sampleData);
    
    // Check that no placeholders remain
    if (rendered.includes('{{')) {
      console.log('❌ Placeholder system failed - some placeholders not replaced');
      console.log('Rendered:', rendered);
      return false;
    }
    
    // Test invalid placeholder detection
    const invalidContent = 'Hello {{invalidPlaceholder}} and {{name}}';
    const validation = validatePlaceholders(invalidContent);
    
    if (validation.valid) {
      console.log('❌ Placeholder validation failed - should detect invalid placeholder');
      return false;
    }
    
    if (validation.invalidPlaceholders.length !== 1) {
      console.log('❌ Placeholder validation failed - wrong number of invalid placeholders');
      return false;
    }
    
    console.log('✅ Placeholder system validation passed');
    return true;
  } catch (error) {
    console.log('❌ Placeholder system test failed:', error);
    return false;
  }
}

function validateTemplateTypes() {
  console.log('\n🧪 Testing Template Types...');
  
  try {
    const validTypes = ['approval', 'general', 'promotion', 'order_confirmation', 'status_update', 'point_notification'];
    
    for (const type of validTypes) {
      const template = new EmailTemplate({
        ...testTemplateData,
        type: type as any
      });
      
      const validationError = template.validateSync();
      if (validationError) {
        console.log(`❌ Template type validation failed for ${type}:`, validationError.message);
        return false;
      }
    }
    
    // Test invalid type
    try {
      const template = new EmailTemplate({
        ...testTemplateData,
        type: 'invalid_type' as any
      });
      
      const validationError = template.validateSync();
      if (!validationError) {
        console.log('❌ Template type validation failed - should reject invalid type');
        return false;
      }
    } catch (error) {
      // Expected to fail
    }
    
    console.log('✅ Template types validation passed');
    return true;
  } catch (error) {
    console.log('❌ Template types test failed:', error);
    return false;
  }
}

async function runValidationTests() {
  console.log('🚀 Starting Email Template Implementation Validation...');
  
  const tests = [
    validateEmailTemplateModel,
    validateTemplateRenderer,
    validateHtmlSanitization,
    validateEmailValidator,
    validatePlaceholderSystem,
    validateTemplateTypes
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ Test failed with error:`, error);
    }
  }
  
  console.log(`\n📊 Validation Results: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 All validation tests passed! Email Template Management implementation is ready.');
  } else {
    console.log('⚠️  Some validation tests failed. Please review the implementation.');
  }
  
  return passedTests === tests.length;
}

// Export for use in other scripts
export {
  runValidationTests,
  validateEmailTemplateModel,
  validateTemplateRenderer,
  validateHtmlSanitization,
  validateEmailValidator,
  validatePlaceholderSystem,
  validateTemplateTypes
};

// Run validation if this file is executed directly
if (require.main === module) {
  runValidationTests().catch(console.error);
}