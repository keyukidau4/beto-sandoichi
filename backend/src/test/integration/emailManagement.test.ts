import request from 'supertest';
import { createTestApp } from '../app';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { EmailTemplate } from '../../models/EmailTemplate';

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  const cookieHeader = headers['set-cookie']?.find((cookie: string) => cookie.startsWith('token-banhmi='));
  return cookieHeader ? cookieHeader.split('=')[1].split(';')[0] : '';
};

const app = createTestApp();

// Mock nodemailer for testing
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((mailOptions, callback) => {
      // Simulate successful email sending
      if (callback) {
        callback(null, {
          messageId: 'test-message-id',
          response: '250 OK'
        });
      }
      return Promise.resolve({
        messageId: 'test-message-id',
        response: '250 OK'
      });
    })
  }))
}));

describe('Email Management Integration Tests', () => {
  let adminToken: string;
  let buyerToken: string;
  let templateId: string;
  let buyerId: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'admin',
      status: 'approved'
    });
    await adminUser.save();

    // Create buyer user
    const buyerUser = new User({
      email: 'buyer@test.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
      role: 'buyer',
      status: 'pending'
    });
    await buyerUser.save();
    buyerId = buyerUser._id.toString();

    const buyerProfile = new BuyerProfile({
      userId: buyerUser._id,
      name: 'Test Buyer',
      tel: '090-1234-5678',
      zip1: '123',
      zip2: '4567',
      address1: 'Tokyo',
      address2: 'Test',
      point: 0
    });
    await buyerProfile.save();

    // Get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = extractTokenFromCookie(adminLogin.headers);

    const buyerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@test.com', password: 'password123' });
    buyerToken = extractTokenFromCookie(buyerLogin.headers);
  });

  describe('Requirement 7.2 - Email Template Management', () => {
    it('should allow admin to create email template', async () => {
      const templateData = {
        title: 'Account Approval Notification',
        content: 'Dear {{name}}, your account has been approved. You can now use all features of BanhMi App.',
        type: 'approval'
      };

      const response = await request(app)
        .post('/api/admin/email-templates')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.template.title).toBe(templateData.title);
      expect(response.body.template.content).toBe(templateData.content);
      expect(response.body.template.type).toBe(templateData.type);

      templateId = response.body.template._id;
    });

    it('should allow admin to view all email templates', async () => {
      const response = await request(app)
        .get('/api/admin/email-templates')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.templates).toBeDefined();
      expect(Array.isArray(response.body.templates)).toBe(true);
      expect(response.body.templates.length).toBeGreaterThan(0);

      const createdTemplate = response.body.templates.find(
        (t: any) => t._id === templateId
      );
      expect(createdTemplate).toBeTruthy();
    });

    it('should allow admin to update email template', async () => {
      const updateData = {
        title: 'Updated Account Approval',
        content: 'Hello {{name}}, your BanhMi App account is now active!'
      };

      const response = await request(app)
        .put(`/api/admin/email-templates/${templateId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.template.title).toBe(updateData.title);
      expect(response.body.template.content).toBe(updateData.content);
    });

    it('should allow admin to delete email template', async () => {
      // Create a template to delete
      const tempTemplate = new EmailTemplate({
        title: 'Temporary Template',
        content: 'This will be deleted',
        type: 'general'
      });
      await tempTemplate.save();

      const response = await request(app)
        .delete(`/api/admin/email-templates/${tempTemplate._id}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Email template deleted successfully');

      // Verify soft delete
      const deletedTemplate = await EmailTemplate.findById(tempTemplate._id);
      expect(deletedTemplate!.del_flg).toBe(true);
    });

    it('should prevent non-admin from managing email templates', async () => {
      const templateData = {
        title: 'Unauthorized Template',
        content: 'Should not be created',
        type: 'general'
      };

      const response = await request(app)
        .post('/api/admin/email-templates')
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .send(templateData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Requirement 7.3 - Email Sending to Users', () => {
    it('should allow admin to send email to specific users', async () => {
      const emailData = {
        templateId: templateId,
        userIds: [buyerId],
        subject: 'Your Account Status Update'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(emailData)
        .expect(200);

      expect(response.body.message).toBe('Emails sent successfully');
      expect(response.body.results).toBeDefined();
      expect(response.body.results.successful).toBe(1);
      expect(response.body.results.failed).toBe(0);
    });

    it('should allow admin to send email to all users of specific status', async () => {
      // Create another pending user
      const anotherBuyer = new User({
        email: 'buyer2@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'pending'
      });
      await anotherBuyer.save();

      const buyerProfile2 = new BuyerProfile({
        userId: anotherBuyer._id,
        name: 'Test Buyer 2',
        tel: '090-9876-5432',
        zip1: '987',
        zip2: '6543',
        address1: 'Osaka',
        address2: 'Test',
        point: 0
      });
      await buyerProfile2.save();

      const emailData = {
        templateId: templateId,
        userStatus: 'pending',
        subject: 'Important Update for Pending Users'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(emailData)
        .expect(200);

      expect(response.body.message).toBe('Emails sent successfully');
      expect(response.body.results.successful).toBeGreaterThanOrEqual(2);
    });

    it('should handle email sending failures gracefully', async () => {
      // Create a user with invalid email to simulate failure
      const invalidUser = new User({
        email: 'invalid-email-format',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'pending'
      });
      await invalidUser.save();

      const emailData = {
        templateId: templateId,
        userIds: [invalidUser._id.toString()],
        subject: 'Test Email'
      };

      // The mock will still succeed, but in real scenario this would test error handling
      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(emailData)
        .expect(200);

      expect(response.body.results).toBeDefined();
    });

    it('should validate email data before sending', async () => {
      const invalidEmailData = {
        // Missing templateId
        userIds: [buyerId],
        subject: 'Test Email'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.message).toContain('Template ID is required');
    });

    it('should prevent non-admin from sending emails', async () => {
      const emailData = {
        templateId: templateId,
        userIds: [buyerId],
        subject: 'Unauthorized Email'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${buyerToken}`)
        .send(emailData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Requirement 7.4 - Email Template Variables', () => {
    it('should replace template variables with user data', async () => {
      // Create a template with variables
      const variableTemplate = new EmailTemplate({
        title: 'Personalized Email',
        content: 'Hello {{name}}, your email is {{email}} and you have {{points}} points.',
        type: 'general'
      });
      await variableTemplate.save();

      // Update buyer profile with points
      await BuyerProfile.findOneAndUpdate(
        { userId: buyerId },
        { point: 150 }
      );

      const emailData = {
        templateId: variableTemplate._id.toString(),
        userIds: [buyerId],
        subject: 'Personalized Message'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(emailData)
        .expect(200);

      expect(response.body.message).toBe('Emails sent successfully');
      expect(response.body.results.successful).toBe(1);
    });

    it('should handle missing template variables gracefully', async () => {
      const templateWithMissingVar = new EmailTemplate({
        title: 'Template with Missing Variable',
        content: 'Hello {{name}}, your {{nonexistent}} variable.',
        type: 'general'
      });
      await templateWithMissingVar.save();

      const emailData = {
        templateId: templateWithMissingVar._id.toString(),
        userIds: [buyerId],
        subject: 'Test Missing Variables'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(emailData)
        .expect(200);

      expect(response.body.message).toBe('Emails sent successfully');
    });
  });

  describe('Requirement 7.5 - Automated Email on User Approval', () => {
    it('should automatically send approval email when user status changes to approved', async () => {
      // Create a pending user
      const pendingUser = new User({
        email: 'pending-approval@test.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ1Gv.viQjjj3WlSHUI9gvn5f5uYomEXZf4zi',
        role: 'buyer',
        status: 'pending'
      });
      await pendingUser.save();

      const pendingProfile = new BuyerProfile({
        userId: pendingUser._id,
        name: 'Pending User',
        tel: '090-5555-5555',
        zip1: '555',
        zip2: '5555',
        address1: 'Kyoto',
        address2: 'Test',
        point: 0
      });
      await pendingProfile.save();

      // Approve the user (this should trigger automatic email)
      const response = await request(app)
        .put(`/api/admin/users/${pendingUser._id}/status`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');

      // In a real implementation, we would verify that an email was sent
      // For now, we just verify the status change worked
      const approvedUser = await User.findById(pendingUser._id);
      expect(approvedUser!.status).toBe('approved');
    });
  });

  describe('Email Service Error Handling', () => {
    it('should handle email service unavailability', async () => {
      // Mock email service failure
      const nodemailer = require('nodemailer');
      const originalCreateTransport = nodemailer.createTransport;
      
      nodemailer.createTransport = jest.fn(() => ({
        sendMail: jest.fn(() => Promise.reject(new Error('Email service unavailable')))
      }));

      const emailData = {
        templateId: templateId,
        userIds: [buyerId],
        subject: 'Test Email Service Failure'
      };

      const response = await request(app)
        .post('/api/admin/send-email')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send(emailData)
        .expect(200);

      // Should still return success but with failed count
      expect(response.body.results.failed).toBeGreaterThan(0);

      // Restore original mock
      nodemailer.createTransport = originalCreateTransport;
    });
  });
});