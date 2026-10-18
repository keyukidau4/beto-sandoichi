import mongoose from 'mongoose';
import { EmailHistory } from '../../models/EmailHistory';
import { EmailRecipient } from '../../models/EmailRecipient';
import { EmailTemplate } from '../../models/EmailTemplate';
import { User } from '../../models/User';
import { BuyerProfile } from '../../models/BuyerProfile';
import { getBulkEmailProgress } from '../../services/bulkEmailService';

describe('Bulk Email Progress Tracking', () => {
  let templateId: mongoose.Types.ObjectId;
  let historyId: mongoose.Types.ObjectId;
  let buyerId1: mongoose.Types.ObjectId;
  let buyerId2: mongoose.Types.ObjectId;
  let buyerId3: mongoose.Types.ObjectId;

  beforeAll(async () => {
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

    // Create test buyers
    const buyer1 = new User({
      email: 'buyer1@test.com',
      password: 'password123',
      role: 'buyer',
      status: 'approved',
      del_flg: false
    });
    await buyer1.save();
    buyerId1 = buyer1._id;

    const buyer2 = new User({
      email: 'buyer2@test.com',
      password: 'password123',
      role: 'buyer',
      status: 'approved',
      del_flg: false
    });
    await buyer2.save();
    buyerId2 = buyer2._id;

    const buyer3 = new User({
      email: 'buyer3@test.com',
      password: 'password123',
      role: 'buyer',
      status: 'approved',
      del_flg: false
    });
    await buyer3.save();
    buyerId3 = buyer3._id;

    // Create buyer profiles
    await BuyerProfile.create({
      userId: buyerId1,
      name: 'Buyer One',
      tel: '090-1234-5678',
      zip1: '123',
      zip2: '4567',
      address1: 'Tokyo, Shibuya',
      address2: 'Building 1',
      point: 100,
      del_flg: false
    });

    await BuyerProfile.create({
      userId: buyerId2,
      name: 'Buyer Two',
      tel: '090-2345-6789',
      zip1: '234',
      zip2: '5678',
      address1: 'Tokyo, Shinjuku',
      address2: 'Building 2',
      point: 200,
      del_flg: false
    });

    await BuyerProfile.create({
      userId: buyerId3,
      name: 'Buyer Three',
      tel: '090-3456-7890',
      zip1: '345',
      zip2: '6789',
      address1: 'Tokyo, Harajuku',
      address2: 'Building 3',
      point: 300,
      del_flg: false
    });
  });

  beforeEach(async () => {
    // Create test email history
    const history = new EmailHistory({
      templateId,
      templateTitle: 'Test Template',
      templateContent: 'Hello {{name}}, your point is {{point}}',
      recipientCount: 3,
      successCount: 0,
      failureCount: 0,
      status: 'sending',
      sentBy: new mongoose.Types.ObjectId(),
      sentAt: new Date()
    });
    await history.save();
    historyId = history._id;
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

  describe('EmailHistory and EmailRecipient Creation', () => {
    test('should create EmailHistory record when bulk email is initiated', async () => {
      const history = await EmailHistory.findById(historyId);
      
      expect(history).toBeTruthy();
      expect(history?.templateId.toString()).toBe(templateId.toString());
      expect(history?.templateTitle).toBe('Test Template');
      expect(history?.recipientCount).toBe(3);
      expect(history?.status).toBe('sending');
      expect(history?.successCount).toBe(0);
      expect(history?.failureCount).toBe(0);
    });

    test('should create EmailRecipient records with pending status', async () => {
      // Create recipient records
      const recipients = [
        {
          historyId,
          buyerId: buyerId1,
          buyerName: 'Buyer One',
          buyerEmail: 'buyer1@test.com',
          personalizedContent: 'Hello Buyer One, your point is 100',
          status: 'pending' as const
        },
        {
          historyId,
          buyerId: buyerId2,
          buyerName: 'Buyer Two',
          buyerEmail: 'buyer2@test.com',
          personalizedContent: 'Hello Buyer Two, your point is 200',
          status: 'pending' as const
        },
        {
          historyId,
          buyerId: buyerId3,
          buyerName: 'Buyer Three',
          buyerEmail: 'buyer3@test.com',
          personalizedContent: 'Hello Buyer Three, your point is 300',
          status: 'pending' as const
        }
      ];

      await EmailRecipient.insertMany(recipients);

      const createdRecipients = await EmailRecipient.find({ historyId });
      
      expect(createdRecipients).toHaveLength(3);
      expect(createdRecipients.every(r => r.status === 'pending')).toBe(true);
      expect(createdRecipients.every(r => r.personalizedContent.length > 0)).toBe(true);
    });
  });

  describe('Status Updates During Processing', () => {
    beforeEach(async () => {
      // Create initial recipient records
      const recipients = [
        {
          historyId,
          buyerId: buyerId1,
          buyerName: 'Buyer One',
          buyerEmail: 'buyer1@test.com',
          personalizedContent: 'Hello Buyer One, your point is 100',
          status: 'pending' as const
        },
        {
          historyId,
          buyerId: buyerId2,
          buyerName: 'Buyer Two',
          buyerEmail: 'buyer2@test.com',
          personalizedContent: 'Hello Buyer Two, your point is 200',
          status: 'pending' as const
        },
        {
          historyId,
          buyerId: buyerId3,
          buyerName: 'Buyer Three',
          buyerEmail: 'buyer3@test.com',
          personalizedContent: 'Hello Buyer Three, your point is 300',
          status: 'pending' as const
        }
      ];

      await EmailRecipient.insertMany(recipients);
    });

    test('should update recipient status to sent after successful email', async () => {
      // Simulate successful email sending
      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId: buyerId1 },
        {
          status: 'sent',
          sentAt: new Date()
        }
      );

      const updatedRecipient = await EmailRecipient.findOne({ historyId, buyerId: buyerId1 });
      
      expect(updatedRecipient?.status).toBe('sent');
      expect(updatedRecipient?.sentAt).toBeTruthy();
      expect(updatedRecipient?.error).toBeUndefined();
    });

    test('should update recipient status to failed with error message', async () => {
      const errorMessage = '[SMTP_CONNECTION] SMTP server connection failed';
      
      // Simulate failed email sending
      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId: buyerId2 },
        {
          status: 'failed',
          error: errorMessage,
          sentAt: new Date()
        }
      );

      const updatedRecipient = await EmailRecipient.findOne({ historyId, buyerId: buyerId2 });
      
      expect(updatedRecipient?.status).toBe('failed');
      expect(updatedRecipient?.error).toBe(errorMessage);
      expect(updatedRecipient?.sentAt).toBeTruthy();
    });

    test('should update EmailHistory counts during processing', async () => {
      // Simulate processing completion
      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId: buyerId1 },
        { status: 'sent', sentAt: new Date() }
      );

      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId: buyerId2 },
        { status: 'failed', error: 'Test error', sentAt: new Date() }
      );

      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId: buyerId3 },
        { status: 'sent', sentAt: new Date() }
      );

      // Update history with final counts
      await EmailHistory.findByIdAndUpdate(historyId, {
        successCount: 2,
        failureCount: 1,
        status: 'completed',
        completedAt: new Date()
      });

      const updatedHistory = await EmailHistory.findById(historyId);
      
      expect(updatedHistory?.successCount).toBe(2);
      expect(updatedHistory?.failureCount).toBe(1);
      expect(updatedHistory?.status).toBe('completed');
      expect(updatedHistory?.completedAt).toBeTruthy();
    });
  });

  describe('Progress Tracking API', () => {
    beforeEach(async () => {
      // Create recipient records with mixed statuses
      const recipients = [
        {
          historyId,
          buyerId: buyerId1,
          buyerName: 'Buyer One',
          buyerEmail: 'buyer1@test.com',
          personalizedContent: 'Hello Buyer One, your point is 100',
          status: 'sent' as const,
          sentAt: new Date()
        },
        {
          historyId,
          buyerId: buyerId2,
          buyerName: 'Buyer Two',
          buyerEmail: 'buyer2@test.com',
          personalizedContent: 'Hello Buyer Two, your point is 200',
          status: 'failed' as const,
          error: '[INVALID_EMAIL] Invalid email format',
          sentAt: new Date()
        },
        {
          historyId,
          buyerId: buyerId3,
          buyerName: 'Buyer Three',
          buyerEmail: 'buyer3@test.com',
          personalizedContent: 'Hello Buyer Three, your point is 300',
          status: 'pending' as const
        }
      ];

      await EmailRecipient.insertMany(recipients);

      // Update history
      await EmailHistory.findByIdAndUpdate(historyId, {
        successCount: 1,
        failureCount: 1,
        status: 'sending'
      });
    });

    test('should provide detailed progress information', async () => {
      const progress = await getBulkEmailProgress(historyId.toString());
      
      expect(progress.historyId).toBe(historyId.toString());
      expect(progress.status).toBe('sending');
      expect(progress.totalRecipients).toBe(3);
      expect(progress.processedCount).toBe(2);
      expect(progress.progressPercentage).toBe(67); // 2/3 * 100 rounded
      expect(progress.successCount).toBe(1);
      expect(progress.failureCount).toBe(1);
      expect(progress.pendingCount).toBe(1);
      expect(progress.sentCount).toBe(1);
      expect(progress.failedCount).toBe(1);
      expect(progress.isComplete).toBe(false);
      expect(progress.recipients).toHaveLength(3);
      expect(progress.failedRecipients).toHaveLength(1);
      expect(progress.currentlyProcessing).toBeTruthy();
      expect(progress.currentlyProcessing?.buyerName).toBe('Buyer Three');
    });

    test('should calculate progress percentage correctly', async () => {
      // Test with all completed
      await EmailRecipient.findOneAndUpdate(
        { historyId, buyerId: buyerId3 },
        { status: 'sent', sentAt: new Date() }
      );

      await EmailHistory.findByIdAndUpdate(historyId, {
        successCount: 2,
        failureCount: 1,
        status: 'completed',
        completedAt: new Date()
      });

      const progress = await getBulkEmailProgress(historyId.toString());
      
      expect(progress.processedCount).toBe(3);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.isComplete).toBe(true);
      expect(progress.currentlyProcessing).toBeNull();
    });

    test('should handle single recipient list', async () => {
      // Create history with single recipient
      const singleHistory = new EmailHistory({
        templateId,
        templateTitle: 'Single Test',
        templateContent: 'Test content',
        recipientCount: 1,
        successCount: 1,
        failureCount: 0,
        status: 'completed',
        sentBy: new mongoose.Types.ObjectId(),
        sentAt: new Date(),
        completedAt: new Date()
      });
      await singleHistory.save();

      // Create single recipient
      await EmailRecipient.create({
        historyId: singleHistory._id,
        buyerId: buyerId1,
        buyerName: 'Single Buyer',
        buyerEmail: 'single@test.com',
        personalizedContent: 'Hello Single Buyer',
        status: 'sent',
        sentAt: new Date()
      });

      const progress = await getBulkEmailProgress(singleHistory._id.toString());
      
      expect(progress.totalRecipients).toBe(1);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.recipients).toHaveLength(1);
      expect(progress.isComplete).toBe(true);
    });

    test('should throw error for non-existent history', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      await expect(getBulkEmailProgress(nonExistentId)).rejects.toThrow('Email history not found');
    });
  });

  describe('Real-time Status Updates', () => {
    test('should provide lightweight status information', async () => {
      // This would be tested through the API endpoint
      // Here we test the data structure that would be returned
      
      const recipients = [
        {
          historyId,
          buyerId: buyerId1,
          buyerName: 'Buyer One',
          buyerEmail: 'buyer1@test.com',
          personalizedContent: 'Hello Buyer One, your point is 100',
          status: 'sent' as const,
          sentAt: new Date()
        },
        {
          historyId,
          buyerId: buyerId2,
          buyerName: 'Buyer Two',
          buyerEmail: 'buyer2@test.com',
          personalizedContent: 'Hello Buyer Two, your point is 200',
          status: 'pending' as const
        }
      ];

      await EmailRecipient.insertMany(recipients);

      const statusCounts = await EmailRecipient.aggregate([
        { $match: { historyId, del_flg: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const counts = statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);

      expect(counts.sent).toBe(1);
      expect(counts.pending).toBe(1);
      expect(counts.failed).toBeUndefined();
    });
  });
});