import { emailService } from './emailService';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import logger from '../utils/logger';

export interface AutomatedEmailData {
  name?: string;
  email?: string;
  point?: number;
  orderNumber?: string;
  totalAmount?: number;
  orderStatus?: string;
  currentDate?: string;
  systemName?: string;
}

/**
 * Automated Email Service for system-triggered emails
 * This service provides high-level functions for sending automated emails
 * without breaking main business processes if email sending fails
 */
export class AutomatedEmailService {
  
  /**
   * Send approval email when user is approved
   */
  static async sendApprovalEmail(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      const buyerProfile = await BuyerProfile.findOne({ userId });
      
      if (!user || !buyerProfile) {
        logger.warn(`Cannot send approval email: User or profile not found for userId: ${userId}`);
        return;
      }

      const emailData: AutomatedEmailData = {
        name: buyerProfile.name,
        email: user.email,
        point: buyerProfile.point,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      };

      await emailService.sendAutomatedEmail('approval', user.email, emailData);
      logger.info(`Approval email sent successfully to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send approval email for userId ${userId}:`, error);
      // Don't throw error to avoid breaking main business process
    }
  }

  /**
   * Send order confirmation email when order is created
   */
  static async sendOrderConfirmationEmail(
    userId: string, 
    orderId: string, 
    totalAmount: number, 
    orderStatus: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      const buyerProfile = await BuyerProfile.findOne({ userId });
      
      if (!user || !buyerProfile) {
        logger.warn(`Cannot send order confirmation email: User or profile not found for userId: ${userId}`);
        return;
      }

      const statusText = orderStatus === 'paid' ? '支払い済み' : '注文受付';

      const emailData: AutomatedEmailData = {
        name: buyerProfile.name,
        email: user.email,
        orderNumber: orderId,
        totalAmount: totalAmount,
        orderStatus: statusText,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      };

      await emailService.sendAutomatedEmail('order_confirmation', user.email, emailData);
      logger.info(`Order confirmation email sent successfully to ${user.email} for order ${orderId}`);
    } catch (error) {
      logger.error(`Failed to send order confirmation email for userId ${userId}, orderId ${orderId}:`, error);
      // Don't throw error to avoid breaking main business process
    }
  }

  /**
   * Send order status update email when order status changes
   */
  static async sendOrderStatusUpdateEmail(
    userId: string, 
    orderId: string, 
    newStatus: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      const buyerProfile = await BuyerProfile.findOne({ userId });
      
      if (!user || !buyerProfile) {
        logger.warn(`Cannot send status update email: User or profile not found for userId: ${userId}`);
        return;
      }

      const statusText = newStatus === 'paid' ? '支払い済み' : 
                        newStatus === 'cancelled' ? 'キャンセル' : '注文受付';

      const emailData: AutomatedEmailData = {
        name: buyerProfile.name,
        email: user.email,
        orderNumber: orderId,
        orderStatus: statusText,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      };

      await emailService.sendAutomatedEmail('status_update', user.email, emailData);
      logger.info(`Status update email sent successfully to ${user.email} for order ${orderId}`);
    } catch (error) {
      logger.error(`Failed to send status update email for userId ${userId}, orderId ${orderId}:`, error);
      // Don't throw error to avoid breaking main business process
    }
  }

  /**
   * Send point notification email when points are updated significantly
   */
  static async sendPointNotificationEmail(
    userId: string, 
    newPointBalance: number,
    pointChange?: number
  ): Promise<void> {
    try {
      // Only send for significant point changes (100+ points)
      if (pointChange && Math.abs(pointChange) < 100) {
        return;
      }

      const user = await User.findById(userId);
      const buyerProfile = await BuyerProfile.findOne({ userId });
      
      if (!user || !buyerProfile) {
        logger.warn(`Cannot send point notification email: User or profile not found for userId: ${userId}`);
        return;
      }

      const emailData: AutomatedEmailData = {
        name: buyerProfile.name,
        email: user.email,
        point: newPointBalance,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      };

      await emailService.sendAutomatedEmail('point_notification', user.email, emailData);
      logger.info(`Point notification email sent successfully to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send point notification email for userId ${userId}:`, error);
      // Don't throw error to avoid breaking main business process
    }
  }

  /**
   * Test automated email functionality
   */
  static async testAutomatedEmails(): Promise<{
    success: boolean;
    results: { [key: string]: boolean };
    errors: string[];
  }> {
    const results: { [key: string]: boolean } = {};
    const errors: string[] = [];

    // Test approval email template
    try {
      await emailService.sendAutomatedEmail('approval', 'test@example.com', {
        name: 'Test User',
        email: 'test@example.com',
        point: 1000,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      });
      results.approval = true;
    } catch (error) {
      results.approval = false;
      errors.push(`Approval email test failed: ${error}`);
    }

    // Test order confirmation email template
    try {
      await emailService.sendAutomatedEmail('order_confirmation', 'test@example.com', {
        name: 'Test User',
        email: 'test@example.com',
        orderNumber: 'TEST123',
        totalAmount: 1500,
        orderStatus: '注文受付',
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      });
      results.order_confirmation = true;
    } catch (error) {
      results.order_confirmation = false;
      errors.push(`Order confirmation email test failed: ${error}`);
    }

    // Test point notification email template
    try {
      await emailService.sendAutomatedEmail('point_notification', 'test@example.com', {
        name: 'Test User',
        email: 'test@example.com',
        point: 2000,
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      });
      results.point_notification = true;
    } catch (error) {
      results.point_notification = false;
      errors.push(`Point notification email test failed: ${error}`);
    }

    // Test status update email template
    try {
      await emailService.sendAutomatedEmail('status_update', 'test@example.com', {
        name: 'Test User',
        email: 'test@example.com',
        orderNumber: 'TEST123',
        orderStatus: '支払い済み',
        currentDate: new Date().toLocaleDateString('ja-JP'),
        systemName: 'BanhMi App'
      });
      results.status_update = true;
    } catch (error) {
      results.status_update = false;
      errors.push(`Status update email test failed: ${error}`);
    }

    const success = Object.values(results).every(result => result === true);

    return {
      success,
      results,
      errors
    };
  }
}

export { AutomatedEmailService as automatedEmailService };