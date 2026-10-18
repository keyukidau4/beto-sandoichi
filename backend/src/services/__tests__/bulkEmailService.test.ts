import { processBulkEmail, getBulkEmailProgress } from '../bulkEmailService';
import { EmailTemplate } from '../../models/EmailTemplate';
import { EmailHistory } from '../../models/EmailHistory';
import { EmailRecipient } from '../../models/EmailRecipient';
import { emailService } from '../emailService';

// Mock the email service
jest.mock('../emailService', () => ({
  emailService: {
    sendSingleEmail: jest.fn()
  }
}));

// Mock the models
jest.mock('../../models/EmailHistory');
jest.mock('../../models/EmailRecipient');

const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const mockEmailHistory = EmailHistory as jest.Mocked<typeof EmailHistory>;
const mockEmailRecipient = EmailRecipient as jest.Mocked<typeof EmailRecipient>;

describe('Bulk Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processBulkEmail', () => {
    const mockTemplate = {
      _id: 'template123',
      title: 'Test Email',
      content: 'Hello {{name}}, you have {{point}} points.',
      type: 'general',
      placeholders: ['{{name}}', '{{point}}'],
      isDefault: false,
      del_flg: false,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    const mockRecipients = [
      {
        _id: 'user1',
        email: 'user1@test.com',
        name: 'User One',
        point: 100
      },
      {
        _id: 'user2',
        email: 'user2@test.com',
        name: 'User Two',
        point: 200
      }
    ];

    it('should process bulk email successfully', async () => {
      // Mock successful email sending
      mockEmailService.sendSingleEmail.mockResolvedValue();
      
      // Mock database updates
      mockEmailRecipient.findOneAndUpdate = jest.fn().mockResolvedValue({});
      mockEmailHistory.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await processBulkEmail('history123', mockTemplate, mockRecipients);

      // Verify email service was called for each recipient
      expect(mockEmailService.sendSingleEmail).toHaveBeenCalledTimes(2);
      
      // Verify first email call
      expect(mockEmailService.sendSingleEmail).toHaveBeenNthCalledWith(1, {
        to: 'user1@test.com',
        subject: 'Test Email',
        html: 'Hello User One, you have 100 points.'
      });

      // Verify second email call
      expect(mockEmailService.sendSingleEmail).toHaveBeenNthCalledWith(2, {
        to: 'user2@test.com',
        subject: 'Test Email',
        html: 'Hello User Two, you have 200 points.'
      });

      // Verify recipient status updates
      expect(mockEmailRecipient.findOneAndUpdate).toHaveBeenCalledTimes(2);
      
      // Verify history update
      expect(mockEmailHistory.findByIdAndUpdate).toHaveBeenCalledWith('history123', {
        successCount: 2,
        failureCount: 0,
        status: 'completed',
        completedAt: expect.any(Date)
      });
    });

    it('should handle email sending failures', async () => {
      // Mock first email success, second email failure
      mockEmailService.sendSingleEmail
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('SMTP error'));
      
      mockEmailRecipient.findOneAndUpdate = jest.fn().mockResolvedValue({});
      mockEmailHistory.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await processBulkEmail('history123', mockTemplate, mockRecipients);

      // Verify both emails were attempted
      expect(mockEmailService.sendSingleEmail).toHaveBeenCalledTimes(2);

      // Verify recipient status updates (2 for success, 2 for failure)
      expect(mockEmailRecipient.findOneAndUpdate).toHaveBeenCalledTimes(2);

      // Verify first recipient marked as sent
      expect(mockEmailRecipient.findOneAndUpdate).toHaveBeenNthCalledWith(1, 
        {
          historyId: 'history123',
          buyerId: 'user1',
          del_flg: false
        },
        {
          personalizedContent: 'Hello User One, you have 100 points.',
          status: 'sent',
          sentAt: expect.any(Date)
        }
      );

      // Verify second recipient marked as failed
      expect(mockEmailRecipient.findOneAndUpdate).toHaveBeenNthCalledWith(2,
        {
          historyId: 'history123',
          buyerId: 'user2',
          del_flg: false
        },
        {
          status: 'failed',
          error: 'SMTP error'
        }
      );

      // Verify history updated with correct counts
      expect(mockEmailHistory.findByIdAndUpdate).toHaveBeenCalledWith('history123', {
        successCount: 1,
        failureCount: 1,
        status: 'completed',
        completedAt: expect.any(Date)
      });
    });

    it('should add delay between emails', async () => {
      mockEmailService.sendSingleEmail.mockResolvedValue();
      mockEmailRecipient.findOneAndUpdate = jest.fn().mockResolvedValue({});
      mockEmailHistory.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const startTime = Date.now();
      await processBulkEmail('history123', mockTemplate, mockRecipients);
      const endTime = Date.now();

      // Should take at least 500ms (one delay between two emails)
      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('getBulkEmailProgress', () => {
    it('should return progress information', async () => {
      const mockHistory = {
        _id: 'history123',
        status: 'completed',
        recipientCount: 2,
        successCount: 1,
        failureCount: 1,
        completedAt: new Date()
      };

      const mockRecipients = [
        { status: 'sent', error: null, sentAt: new Date() },
        { status: 'failed', error: 'SMTP error', sentAt: null }
      ];

      mockEmailHistory.findById = jest.fn().mockResolvedValue(mockHistory);
      mockEmailRecipient.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockRecipients)
      });

      const progress = await getBulkEmailProgress('history123');

      expect(progress).toEqual({
        historyId: 'history123',
        status: 'completed',
        totalRecipients: 2,
        successCount: 1,
        failureCount: 1,
        pendingCount: 0,
        sentCount: 1,
        failedCount: 1,
        isComplete: true,
        completedAt: mockHistory.completedAt,
        recipients: mockRecipients.map(r => ({
          status: r.status,
          error: r.error,
          sentAt: r.sentAt
        }))
      });
    });

    it('should throw error for non-existent history', async () => {
      mockEmailHistory.findById = jest.fn().mockResolvedValue(null);

      await expect(getBulkEmailProgress('nonexistent')).rejects.toThrow('Email history not found');
    });
  });
});