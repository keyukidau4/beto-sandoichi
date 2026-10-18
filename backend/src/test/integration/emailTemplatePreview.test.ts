/**
 * Integration tests for email template preview functionality
 */

import request from 'supertest';
import { createTestApp } from '../app';
import { User } from '../../models/User';
import { EmailTemplate } from '../../models/EmailTemplate';

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  const cookieHeader = headers['set-cookie']?.find((cookie: string) => cookie.startsWith('token-banhmi='));
  return cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : '';
};

const app = createTestApp();

describe('Email Template Preview Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;
  let templateId: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = new User({
      email: 'admin-preview@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'admin',
      status: 'approved'
    });
    await adminUser.save();

    // Create buyer user
    const buyerUser = new User({
      email: 'buyer-preview@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'buyer',
      status: 'approved'
    });
    await buyerUser.save();

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin-preview@test.com', password: 'password123' });
    adminToken = extractTokenFromCookie(adminLogin.headers);

    const buyerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer-preview@test.com', password: 'password123' });
    buyerToken = extractTokenFromCookie(buyerLogin.headers);

    // Create a test template
    const template = new EmailTemplate({
      title: 'Preview Test Template',
      content: `
        <h2>こんにちは、{{name}}様</h2>
        <p>{{systemName}}からのお知らせです。</p>
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
        <p>無効なプレースホルダー: {{invalidPlaceholder}}</p>
      `,
      type: 'general',
      placeholders: ['{{name}}', '{{email}}', '{{point}}', '{{currentDate}}', '{{systemName}}', '{{orderNumber}}', '{{totalAmount}}', '{{orderStatus}}', '{{invalidPlaceholder}}'],
      isDefault: false,
      del_flg: false
    });
    await template.save();
    templateId = template._id.toString();
  });

  describe('POST /api/admin/email-templates/:id/preview', () => {
    it('should generate preview with sample data for valid template', async () => {
      const response = await request(app)
        .post(`/api/admin/email-templates/${templateId}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email template preview generated successfully');
      
      // Check preview HTML content
      expect(response.body.data.previewHtml).toBeDefined();
      expect(response.body.data.previewHtml).toContain('田中太郎'); // Sample name
      expect(response.body.data.previewHtml).toContain('tanaka@example.com'); // Sample email
      expect(response.body.data.previewHtml).toContain('1500'); // Sample points
      expect(response.body.data.previewHtml).toContain('BanhMi App'); // System name
      expect(response.body.data.previewHtml).toContain('ORD-2024-001'); // Sample order number
      expect(response.body.data.previewHtml).toContain('2800'); // Sample total amount
      expect(response.body.data.previewHtml).toContain('配送中'); // Sample order status
      
      // Check sample data
      expect(response.body.data.sampleData).toBeDefined();
      expect(response.body.data.sampleData.name).toBe('田中太郎');
      expect(response.body.data.sampleData.email).toBe('tanaka@example.com');
      expect(response.body.data.sampleData.point).toBe(1500);
      expect(response.body.data.sampleData.systemName).toBe('BanhMi App');
      
      // Check placeholder validation
      expect(response.body.data.placeholders).toBeDefined();
      expect(response.body.data.placeholders.valid).toContain('{{name}}');
      expect(response.body.data.placeholders.valid).toContain('{{email}}');
      expect(response.body.data.placeholders.valid).toContain('{{point}}');
      expect(response.body.data.placeholders.invalid).toContain('{{invalidPlaceholder}}');
    });

    it('should handle missing placeholders gracefully in preview', async () => {
      // Create template with only invalid placeholders
      const invalidTemplate = new EmailTemplate({
        title: 'Invalid Placeholder Template',
        content: 'Hello {{invalidName}}, your {{invalidEmail}} and {{invalidPoint}}',
        type: 'general',
        placeholders: ['{{invalidName}}', '{{invalidEmail}}', '{{invalidPoint}}'],
        isDefault: false,
        del_flg: false
      });
      await invalidTemplate.save();

      const response = await request(app)
        .post(`/api/admin/email-templates/${invalidTemplate._id}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Preview should still be generated but with unreplaced placeholders
      expect(response.body.data.previewHtml).toContain('{{invalidName}}');
      expect(response.body.data.previewHtml).toContain('{{invalidEmail}}');
      expect(response.body.data.previewHtml).toContain('{{invalidPoint}}');
      
      // All placeholders should be marked as invalid
      expect(response.body.data.placeholders.valid).toHaveLength(0);
      expect(response.body.data.placeholders.invalid).toHaveLength(3);

      // Clean up
      await EmailTemplate.findByIdAndDelete(invalidTemplate._id);
    });

    it('should return 404 for non-existent template', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .post(`/api/admin/email-templates/${nonExistentId}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email template not found');
    });

    it('should return 400 for invalid template ID format', async () => {
      const response = await request(app)
        .post('/api/admin/email-templates/invalid-id/preview')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid ObjectId');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post(`/api/admin/email-templates/${templateId}/preview`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token is required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post(`/api/admin/email-templates/${templateId}/preview`)
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should handle soft-deleted template', async () => {
      // Create and soft delete a template
      const deletedTemplate = new EmailTemplate({
        title: 'Deleted Template',
        content: 'This template is deleted: {{name}}',
        type: 'general',
        placeholders: ['{{name}}'],
        isDefault: false,
        del_flg: true // Soft deleted
      });
      await deletedTemplate.save();

      const response = await request(app)
        .post(`/api/admin/email-templates/${deletedTemplate._id}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email template not found');

      // Clean up
      await EmailTemplate.findByIdAndDelete(deletedTemplate._id);
    });

    it('should handle template with no placeholders', async () => {
      // Create template without placeholders
      const noPlaceholderTemplate = new EmailTemplate({
        title: 'No Placeholder Template',
        content: '<h1>Welcome to BanhMi App</h1><p>Thank you for joining us!</p>',
        type: 'general',
        placeholders: [],
        isDefault: false,
        del_flg: false
      });
      await noPlaceholderTemplate.save();

      const response = await request(app)
        .post(`/api/admin/email-templates/${noPlaceholderTemplate._id}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.previewHtml).toBe('<h1>Welcome to BanhMi App</h1><p>Thank you for joining us!</p>');
      expect(response.body.data.placeholders.valid).toHaveLength(0);
      expect(response.body.data.placeholders.invalid).toHaveLength(0);

      // Clean up
      await EmailTemplate.findByIdAndDelete(noPlaceholderTemplate._id);
    });

    it('should handle template with HTML content correctly', async () => {
      // Create template with rich HTML content
      const htmlTemplate = new EmailTemplate({
        title: 'HTML Template',
        content: `
          <html>
            <body>
              <div style="font-family: Arial, sans-serif;">
                <h1 style="color: #333;">Hello {{name}}!</h1>
                <p>Your current points: <strong>{{point}}</strong></p>
                <table border="1">
                  <tr>
                    <td>Email</td>
                    <td>{{email}}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>{{currentDate}}</td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
        `,
        type: 'general',
        placeholders: ['{{name}}', '{{point}}', '{{email}}', '{{currentDate}}'],
        isDefault: false,
        del_flg: false
      });
      await htmlTemplate.save();

      const response = await request(app)
        .post(`/api/admin/email-templates/${htmlTemplate._id}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check that HTML structure is preserved
      expect(response.body.data.previewHtml).toContain('<html>');
      expect(response.body.data.previewHtml).toContain('<table border="1">');
      expect(response.body.data.previewHtml).toContain('<strong>1500</strong>');
      expect(response.body.data.previewHtml).toContain('田中太郎');
      
      // All placeholders should be valid
      expect(response.body.data.placeholders.valid).toHaveLength(4);
      expect(response.body.data.placeholders.invalid).toHaveLength(0);

      // Clean up
      await EmailTemplate.findByIdAndDelete(htmlTemplate._id);
    });

    it('should generate consistent sample data across multiple requests', async () => {
      // Make multiple requests and verify sample data consistency
      const response1 = await request(app)
        .post(`/api/admin/email-templates/${templateId}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      const response2 = await request(app)
        .post(`/api/admin/email-templates/${templateId}/preview`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      // Sample data should be consistent (except for currentDate which might vary)
      expect(response1.body.data.sampleData.name).toBe(response2.body.data.sampleData.name);
      expect(response1.body.data.sampleData.email).toBe(response2.body.data.sampleData.email);
      expect(response1.body.data.sampleData.point).toBe(response2.body.data.sampleData.point);
      expect(response1.body.data.sampleData.systemName).toBe(response2.body.data.sampleData.systemName);
    });
  });

  afterAll(async () => {
    // Clean up test template
    if (templateId) {
      await EmailTemplate.findByIdAndDelete(templateId);
    }
  });
});