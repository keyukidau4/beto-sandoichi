/**
 * Simple test to verify the preview implementation works
 */

import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import { previewEmailTemplate } from '../controllers/adminController';

const testPreviewImplementation = async () => {
  try {
    console.log('🧪 Testing Preview Implementation...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banhmi-app');
    console.log('✅ Connected to database');

    // Create a test template
    const testTemplate = new EmailTemplate({
      title: 'Test Preview Implementation',
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
      type: 'general',
      placeholders: [],
      isDefault: false,
      del_flg: false
    });

    await testTemplate.save();
    console.log('✅ Test template created');

    // Mock request and response objects
    const mockReq = {
      params: { id: testTemplate._id.toString() }
    } as any;

    let responseData: any = null;
    const mockRes = {
      status: (code: number) => {
        console.log(`Response status: ${code}`);
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        console.log('Response data received');
        return mockRes;
      }
    } as any;

    // Test the preview function
    console.log('🎨 Testing preview function...');
    await previewEmailTemplate(mockReq, mockRes);

    console.log('Preview response:', JSON.stringify(responseData, null, 2));

    // Verify the response structure
    if (!responseData.success) {
      throw new Error('Response success should be true');
    }
    if (responseData.message !== 'Email template preview generated successfully') {
      throw new Error('Response message is incorrect');
    }
    if (!responseData.data.previewHtml) {
      throw new Error('Preview HTML should be defined');
    }
    if (!responseData.data.sampleData) {
      throw new Error('Sample data should be defined');
    }
    if (!responseData.data.placeholders) {
      throw new Error('Placeholders should be defined');
    }

    // Verify sample data is populated
    if (responseData.data.sampleData.name !== '田中太郎') {
      throw new Error('Sample name should be 田中太郎');
    }
    if (responseData.data.sampleData.email !== 'tanaka@example.com') {
      throw new Error('Sample email should be tanaka@example.com');
    }
    if (responseData.data.sampleData.point !== 1500) {
      throw new Error('Sample point should be 1500');
    }

    // Verify placeholders are validated
    if (!responseData.data.placeholders.valid.includes('{{name}}')) {
      throw new Error('Valid placeholders should include {{name}}');
    }
    if (!responseData.data.placeholders.valid.includes('{{email}}')) {
      throw new Error('Valid placeholders should include {{email}}');
    }
    if (!responseData.data.placeholders.invalid.includes('{{invalidPlaceholder}}')) {
      throw new Error('Invalid placeholders should include {{invalidPlaceholder}}');
    }

    // Verify HTML is rendered with sample data
    if (!responseData.data.previewHtml.includes('田中太郎')) {
      throw new Error('Preview HTML should contain sample name');
    }
    if (!responseData.data.previewHtml.includes('tanaka@example.com')) {
      throw new Error('Preview HTML should contain sample email');
    }
    if (!responseData.data.previewHtml.includes('1500')) {
      throw new Error('Preview HTML should contain sample points');
    }
    if (!responseData.data.previewHtml.includes('BanhMi App')) {
      throw new Error('Preview HTML should contain system name');
    }

    // Clean up
    await EmailTemplate.findByIdAndDelete(testTemplate._id);
    console.log('🧹 Test template cleaned up');

    console.log('\n✅ Preview implementation test completed successfully!');

  } catch (error) {
    console.error('❌ Preview implementation test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testPreviewImplementation();
}

export { testPreviewImplementation };