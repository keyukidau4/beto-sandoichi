import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import { validatePlaceholders, extractPlaceholders, analyzePlaceholders } from './templateRenderer';
import { validateEmailTemplate } from './validation';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Test script for email template validation and sanitization
 */

const testValidation = async () => {
  console.log('🧪 Testing Email Template Validation and Sanitization...\n');

  // Test 1: Basic validation with Joi schema
  console.log('1. Testing basic validation with Joi schema:');
  
  const validTemplate = {
    title: 'Test Template',
    content: '<p>Hello {{name}}, your point is {{point}}</p>',
    type: 'general'
  };

  const invalidTemplate = {
    title: '', // Invalid: empty title
    content: '<p>Hello {{name}}</p>',
    type: 'invalid_type' // Invalid: not in enum
  };

  const validResult = validateEmailTemplate(validTemplate);
  const invalidResult = validateEmailTemplate(invalidTemplate);

  console.log('Valid template validation:', validResult.error ? 'FAILED' : 'PASSED');
  console.log('Invalid template validation:', invalidResult.error ? 'PASSED' : 'FAILED');
  
  if (invalidResult.error) {
    console.log('Validation errors:', invalidResult.error.details.map(d => d.message));
  }
  console.log();

  // Test 2: HTML sanitization
  console.log('2. Testing HTML sanitization:');
  
  const maliciousContent = `
    <p>Hello {{name}}</p>
    <script>alert('XSS')</script>
    <img src="x" onerror="alert('XSS')">
    <a href="javascript:alert('XSS')">Click me</a>
    <div onclick="alert('XSS')">Dangerous div</div>
  `;

  const sanitizedContent = DOMPurify.sanitize(maliciousContent, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'a', 'div', 'span', 'img'
    ],
    ALLOWED_ATTR: ['href', 'target', 'style', 'src', 'alt', 'width', 'height']
  });

  console.log('Original content length:', maliciousContent.length);
  console.log('Sanitized content length:', sanitizedContent.length);
  console.log('Sanitized content:', sanitizedContent);
  console.log('XSS removed:', !sanitizedContent.includes('script') && !sanitizedContent.includes('onerror') && !sanitizedContent.includes('onclick'));
  console.log();

  // Test 3: Placeholder extraction
  console.log('3. Testing placeholder extraction:');
  
  const templateWithPlaceholders = `
    <h1>Hello {{name}}!</h1>
    <p>Your email: {{email}}</p>
    <p>Current points: {{point}}</p>
    <p>Order #{{orderNumber}} total: {{totalAmount}}</p>
    <p>Date: {{currentDate}}</p>
    <p>Invalid: {{invalidPlaceholder}}</p>
    <p>Duplicate: {{name}} again</p>
  `;

  const extractedPlaceholders = extractPlaceholders(templateWithPlaceholders);
  console.log('Extracted placeholders:', extractedPlaceholders);
  console.log();

  // Test 4: Placeholder validation
  console.log('4. Testing placeholder validation:');
  
  const placeholderValidation = validatePlaceholders(templateWithPlaceholders);
  console.log('Validation result:', placeholderValidation);
  console.log('Valid placeholders:', placeholderValidation.validPlaceholders);
  console.log('Invalid placeholders:', placeholderValidation.invalidPlaceholders);
  console.log('Overall valid:', placeholderValidation.valid);
  console.log();

  // Test 5: Detailed placeholder analysis
  console.log('5. Testing detailed placeholder analysis:');
  
  const analysis = analyzePlaceholders(templateWithPlaceholders);
  console.log('Analysis:', analysis.analysis);
  console.log('Valid placeholders with counts:', analysis.placeholders.valid);
  console.log('Invalid placeholders with reasons:', analysis.placeholders.invalid);
  console.log();

  // Test 6: Edge cases
  console.log('6. Testing edge cases:');
  
  const edgeCases = [
    '', // Empty content
    null, // Null content
    '{{}}', // Empty placeholder
    '{{name', // Malformed placeholder
    'name}}', // Malformed placeholder
    '{{ name }}', // Placeholder with spaces
    '{{NAME}}', // Uppercase placeholder
    '{{name_with_underscore}}', // Placeholder with underscore
    '{{123invalid}}', // Placeholder starting with number
  ];

  edgeCases.forEach((testCase, index) => {
    try {
      const result = validatePlaceholders(testCase as string);
      console.log(`Edge case ${index + 1} (${JSON.stringify(testCase)}):`, result.valid ? 'VALID' : 'INVALID');
    } catch (error) {
      console.log(`Edge case ${index + 1} (${JSON.stringify(testCase)}): ERROR -`, error instanceof Error ? error.message : String(error));
    }
  });
  console.log();

  // Test 7: Title validation
  console.log('7. Testing title validation:');
  
  const titleTests = [
    { title: 'Valid Title', expected: true },
    { title: '', expected: false },
    { title: 'A'.repeat(201), expected: false }, // Too long
    { title: '   Valid Title   ', expected: true }, // Should be trimmed
    { title: 'Valid Title with 日本語', expected: true },
  ];

  titleTests.forEach((test, index) => {
    const result = validateEmailTemplate({ title: test.title, content: 'test', type: 'general' });
    const passed = (result.error === undefined) === test.expected;
    console.log(`Title test ${index + 1}: ${passed ? 'PASSED' : 'FAILED'} - "${test.title}"`);
  });
  console.log();

  // Test 8: Type validation
  console.log('8. Testing type validation:');
  
  const typeTests = [
    { type: 'approval', expected: true },
    { type: 'general', expected: true },
    { type: 'promotion', expected: true },
    { type: 'order_confirmation', expected: true },
    { type: 'status_update', expected: true },
    { type: 'point_notification', expected: true },
    { type: 'invalid_type', expected: false },
    { type: '', expected: false },
    { type: null, expected: false },
  ];

  typeTests.forEach((test, index) => {
    const result = validateEmailTemplate({ title: 'Test', content: 'test', type: test.type });
    const passed = (result.error === undefined) === test.expected;
    console.log(`Type test ${index + 1}: ${passed ? 'PASSED' : 'FAILED'} - "${test.type}"`);
  });

  console.log('\n✅ Email template validation and sanitization tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  testValidation().catch(console.error);
}

export { testValidation };