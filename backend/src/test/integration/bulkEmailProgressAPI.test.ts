import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp } from '../app';
import { EmailHistory } from '../../models/EmailHistory';
import { EmailRecipient } from '../../models/EmailRecipient';
import { EmailTemplate } from '../../models/EmailTemplate';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';

const app = createTestApp();

describe('Bulk Email Progress API Integration Tests', () => {
  let adminToken: string;
  let templateId: mongoose.Types.ObjectId;
  let historyId: mongoose.Types.ObjectId;
  let buyerId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      status: 'approved',
      del_flg: false
    });
    await adminUser.save();

    // Login admin to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    // Extract token from cookie
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies && Array.isArray(cookies)) {
      const tokenCookie = cookies.find((cookie: string) => cookie.startsWith('token-banhmi='));
      if (tokenCookie) {
        adminToken = tokenCookie.split('=')[1].split(';')[0];
      }
    }

    // Create test template
    const template = new EmailTemplate({
      title: 'Test Template',
      content: 'Hello {{name}}, your point is {{point}}',
      type: 'general',
      placeholders: ['name', 'point'],
      isDefault: false,
      del_flg: false
    });
    await template.save();
    templateId = template._id;

    // Create test buyer
    const buyer = new User({
      email: 'buyer@test.com',
      password: 'password123',
      role: 'buyer',
      status: 'approved',
      del_flg: false
    });
    await buyer.save();
    buyerId = buyer._id;

    // Create buyer profile
    await BuyerProfile.create({
      userId: buyerId,
      name: 'Test Buyer',
      tel: '090-1234-5678',
      zip1: '123',
      zip2: '4567',
      address1: 'Tokyo, Shibuya',
      address2: 'Building 1',
      point: 100,
      del_flg: false
    });
  });

  beforeEach(async () => {
    // Create test email history
    const history = new EmailHistory({
      templateId,
      templateTitle: 'Test Template',
      templateContent: 'Hello {{name}}, your point is {{point}}',
      recipientCount: 1,
      successCount: 0,
      failureCount: 0,
      status: 'sending',
      sentBy: new mongoose.Types.ObjectId(),
      sentAt: new Date()
    });
    await history.save();
    historyId = history._id;

    // Create test recipient
    await EmailRecipient.create({
      historyId,
      buyerId,
      buyerName: 'Test Buyer',
      buyerEmail: 'buyer@test.com',
      personalizedContent: 'Hello Test Buyer, your point is 100',
      status: 'pending'
    });
  });

  afterEach(async () => {
    await EmailHistory.deleteMany({});
    await EmailRecipient.deleteMany({});
  });

  afterAll(async () => {
    await EmailTemplate.deleteMany({});
    await User.deleteMany({});
    await BuyerProfile.deleteMany({});
  });

  describe('GET /api/admin/email/send-progress/:id', () => {
    test('should return detailed progress information', async () => {
      const response = await request(app)
        .get(`/api/admin/email/send-progress/${historyId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.historyId).toBe(historyId.toString());
      expect(response.body.data.status).toBe('sending');
      expect(response.body.data.totalRecipients).toBe(1);
      expect(response.body.data.pendingCount).toBe(1);
      expect(response.body.data.recipients).toHaveLength(1);
      expect(response.body.data.currentlyProcessing).toBeTruthy();
      expect(response.body.data.currentlyProcessing.buyerName).toBe('Test Buyer');
    });

    test('should return 404 for non-existent history', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/admin/email/send-progress/${nonExistentId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email history not found');
    });

    test('should require admin authentication', async () => {
      await request(app)
        .get(`/api/admin/email/send-progress/${historyId}`)
        .expect(401);
    });
  });

  describe('GET /api/admin/email/send-status/:id', () => {
    test('should return lightweight status information', async () => {
      const response = await request(app)
        .get(`/api/admin/email/send-status/${historyId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.historyId).toBe(historyId.toString());
      expect(response.body.data.status).toBe('sending');
      expect(response.body.data.totalRecipients).toBe(1);
      expect(response.body.data.processedCount).toBe(0);
      expect(response.body.data.progressPercentage).toBe(0);
      expect(response.body.data.pendingCount).toBe(1);
      expect(response.body.data.isComplete).toBe(false);
    });

    test('should show progress updates when recipients are processed', async () => {
      // Update recipient to sent status
      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId },
        { status: 'sent', sentAt: new Date() }
      );

      // Update history counts
      await EmailHistory.findByIdAndUpdate(historyId, {
        successCount: 1,
        status: 'completed',
        completedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/admin/email/send-status/${historyId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.data.processedCount).toBe(1);
      expect(response.body.data.progressPercentage).toBe(100);
      expect(response.body.data.successCount).toBe(1);
      expect(response.body.data.pendingCount).toBe(0);
      expect(response.body.data.isComplete).toBe(true);
    });

    test('should return 404 for non-existent history', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/admin/email/send-status/${nonExistentId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email history not found');
    });

    test('should require admin authentication', async () => {
      await request(app)
        .get(`/api/admin/email/send-status/${historyId}`)
        .expect(401);
    });
  });

  describe('Progress tracking during bulk email processing', () => {
    test('should track progress through complete bulk email flow', async () => {
      // Step 1: Initiate bulk email
      const bulkEmailResponse = await request(app)
        .post('/api/admin/email/send-bulk')
        .set('Cookie', `token-banhmi=${adminToken}`)
        .send({
          templateId: templateId.toString(),
          recipientIds: [buyerId.toString()]
        })
        .expect(200);

      const newHistoryId = bulkEmailResponse.body.data.historyId;

      // Step 2: Check initial status (should be sending with pending recipients)
      const initialStatus = await request(app)
        .get(`/api/admin/email/send-status/${newHistoryId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(initialStatus.body.data.status).toBe('sending');
      expect(initialStatus.body.data.totalRecipients).toBe(1);
      expect(initialStatus.body.data.pendingCount).toBe(1);
      expect(initialStatus.body.data.progressPercentage).toBe(0);

      // Step 3: Wait a moment for processing (in real scenario, this would be async)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 4: Check detailed progress
      const detailedProgress = await request(app)
        .get(`/api/admin/email/send-progress/${newHistoryId}`)
        .set('Cookie', `token-banhmi=${adminToken}`)
        .expect(200);

      expect(detailedProgress.body.data.recipients).toHaveLength(1);
      expect(detailedProgress.body.data.recipients[0].buyerEmail).toBe('buyer@test.com');
      expect(detailedProgress.body.data.templateTitle).toBe('Test Template');
    });
  });
});