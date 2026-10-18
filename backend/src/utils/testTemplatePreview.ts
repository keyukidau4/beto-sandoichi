/**
 * Test script for email template preview functionality
 */

import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import { renderTemplatePreview, getSampleTemplateData, validatePlaceholders } from './templateRenderer';

const testTemplatePreview = async () => {
  try {
    console.log('🧪 Testing Email Template Preview Functionality...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banhmi-app');
    console.log('✅ Connected to database');

    // Create a test template with various placeholders
    const testTemplate = new EmailTemplate({
      title: 'Test Preview Template',
      content: `
        <h2>こんにちは、{{name}}様</h2>
        <p>この度は、{{systemName}}にご登録いただき、ありがとうございます。</p>
        <p>お客様の情報:</p>
        <ul>
          <li>メールアドレス: {{email}}</li>
          <li>現在のポイント: {{point}}ポイント</li>
          <li>登録日: {{currentDate}}</li>
        </ul>
        
        <h3>注文情報</h3>
        <p>注文番号: {{orderNumber}}</p>
        <p>合計金額: {{totalAmount}}円</p>
        <p>注文状況: {{orderStatus}}</p>
        
        <p>今後ともよろしくお願いいたします。</p>
        <p>{{systemName}}チーム</p>
      `,
      type: 'general',
      placeholders: [],
      isDefault: false,
      del_flg: false
    });

    await testTemplate.save();
    console.log('✅ Test template created');

    // Test 1: Generate sample data
    console.log('\n📋 Test 1: Sample Data Generation');
    const sampleData = getSampleTemplateData();
    console.log('Sample data:', JSON.stringify(sampleData, null, 2));

    // Test 2: Render template with sample data
    console.log('\n🎨 Test 2: Template Rendering');
    const previewHtml = renderTemplatePreview(testTemplate.content);
    console.log('Preview HTML:');
    console.log(previewHtml);

    // Test 3: Validate placeholders
    console.log('\n✅ Test 3: Placeholder Validation');
    const placeholderValidation = validatePlaceholders(testTemplate.content);
    console.log('Placeholder validation:', JSON.stringify(placeholderValidation, null, 2));

    // Test 4: Test with missing placeholders
    console.log('\n❓ Test 4: Missing Placeholders Handling');
    const templateWithInvalidPlaceholders = `
      <h2>Hello {{name}}</h2>
      <p>Invalid placeholder: {{invalidPlaceholder}}</p>
      <p>Another invalid: {{anotherInvalid}}</p>
      <p>Valid placeholder: {{email}}</p>
    `;
    
    const invalidValidation = validatePlaceholders(templateWithInvalidPlaceholders);
    console.log('Invalid placeholder validation:', JSON.stringify(invalidValidation, null, 2));
    
    const previewWithInvalid = renderTemplatePreview(templateWithInvalidPlaceholders);
    console.log('Preview with invalid placeholders:');
    console.log(previewWithInvalid);

    // Test 5: Test empty template
    console.log('\n🔍 Test 5: Empty Template Handling');
    const emptyPreview = renderTemplatePreview('');
    console.log('Empty template preview:', emptyPreview);

    // Test 6: Test null/undefined template
    console.log('\n🔍 Test 6: Null/Undefined Template Handling');
    const nullPreview = renderTemplatePreview(null as any);
    console.log('Null template preview:', nullPreview);

    // Clean up test template
    await EmailTemplate.findByIdAndDelete(testTemplate._id);
    console.log('\n🧹 Test template cleaned up');

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testTemplatePreview();
}

export { testTemplatePreview };