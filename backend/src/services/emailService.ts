import nodemailer from 'nodemailer';
import { EmailTemplate } from '../models/EmailTemplate';
import { EmailHistory, EmailHistoryCreate } from '../models/EmailHistory';
import { EmailRecipient } from '../models/EmailRecipient';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { createEmailTransporter, validateEmailConfig, testEmailConnection } from '../config/email';
import { config } from '../config/environment';
import { validateEmail, validateEmails, sanitizeEmail, validateRecipientLimit } from '../utils/emailValidator';
import { renderTemplate, TemplateData } from '../utils/templateRenderer';
import { 
  EmailError, 
  EmailErrorCode, 
  SendingError,
  classifyError 
} from '../utils/emailErrors';
import { emailLogger } from './emailLoggingService';
import { emailHealthMonitor } from './emailHealthMonitor';
import { emailErrorRecoveryService } from './emailErrorRecoveryService';
import mongoose, { ObjectId } from 'mongoose';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

interface SendEmailToUsersOptions {
  userIds: string[];
  templateId: string;
}

interface SendSingleEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Legacy error codes for backward compatibility
export const EMAIL_ERROR_CODES = {
  INVALID_EMAIL: EmailErrorCode.INVALID_EMAIL_ADDRESS,
  TEMPLATE_NOT_FOUND: EmailErrorCode.TEMPLATE_NOT_FOUND,
  RECIPIENT_LIMIT_EXCEEDED: EmailErrorCode.RECIPIENT_LIMIT_EXCEEDED,
  SMTP_ERROR: EmailErrorCode.SMTP_CONNECTION_FAILED,
  RATE_LIMIT_EXCEEDED: EmailErrorCode.RATE_LIMIT_EXCEEDED,
  VALIDATION_ERROR: EmailErrorCode.TEMPLATE_VALIDATION_FAILED
};

class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;
  public adminId?: mongoose.Types.ObjectId;

  constructor() {
    this.transporter =  createEmailTransporter();
    this.isConfigured = validateEmailConfig();
    
    // Test connection on initialization in production
    if (config.nodeEnv === 'production' && this.isConfigured) {
      this.testConnection().catch(error => {
        console.error('Email service initialization failed:', error);
      });
    }
  }

  /**
   * Send a single email with comprehensive error handling and recovery
   */
  async sendSingleEmail(options: SendSingleEmailOptions): Promise<void> {
    const operationId = `single_email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Validate email address
    if (!validateEmail(options.to)) {
      const error = new EmailError(
        `Invalid email address: ${options.to}`,
        EmailErrorCode.INVALID_EMAIL_ADDRESS
      );
      
      emailLogger.logError(
        'SINGLE_EMAIL_VALIDATION_FAILED',
        error,
        undefined,
        undefined,
        options.to,
        { operationId, subject: options.subject }
      );
      
      throw error;
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(options.to);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@banhmi-app.com',
      to: sanitizedEmail,
      subject: options.subject,
      html: options.html,
    };

    try {
      // Check service availability before attempting to send
      if (!emailHealthMonitor.isServiceAvailable()) {
        const error = new SendingError(
          'Email service is currently unavailable',
          EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE,
          true,
          300 // retry after 5 minutes
        );

        // Attempt recovery
        const recoveryResult = await emailErrorRecoveryService.recoverFromError(
          error,
          {
            operationId,
            recipientEmail: sanitizedEmail
          },
          {
            enableRetry: true,
            enableGracefulDegradation: true,
            maxRetryAttempts: 3
          }
        );

        if (!recoveryResult.recovered) {
          emailLogger.logError(
            'SINGLE_EMAIL_SERVICE_UNAVAILABLE',
            error,
            undefined,
            undefined,
            sanitizedEmail,
            { operationId, recoveryResult }
          );
          throw error;
        }
      }

      if (!this.isConfigured) {
        const error = new SendingError(
          'Email service is not properly configured',
          EmailErrorCode.CONFIGURATION_ERROR,
          false // not retryable - requires manual fix
        );
        
        emailLogger.logError(
          'SINGLE_EMAIL_CONFIGURATION_ERROR',
          error,
          undefined,
          undefined,
          sanitizedEmail,
          { operationId }
        );
        
        throw error;
      }

      // Execute email sending with circuit breaker protection
      const result = await emailHealthMonitor.executeWithCircuitBreaker(
        async () => {
          return await this.transporter.sendMail(mailOptions);
        },
        `SINGLE_EMAIL_SEND_${sanitizedEmail}`
      );

      const duration = Date.now() - startTime;
      
      emailLogger.logSuccess(
        'SINGLE_EMAIL_SENT_SUCCESSFULLY',
        undefined,
        undefined,
        {
          operationId,
          recipientEmail: sanitizedEmail,
          subject: options.subject,
          messageId: result.messageId,
          duration
        },
        duration
      );

      console.log('Email sent successfully to:', sanitizedEmail, 'MessageId:', result.messageId);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const emailError = classifyError(error);
      
      // Log the error with detailed context
      emailLogger.logError(
        'SINGLE_EMAIL_SEND_FAILED',
        emailError,
        undefined,
        undefined,
        sanitizedEmail,
        {
          operationId,
          subject: options.subject,
          duration,
          originalError: error.message
        }
      );

      // Attempt error recovery
      try {
        const recoveryResult = await emailErrorRecoveryService.recoverFromError(
          emailError,
          {
            operationId,
            recipientEmail: sanitizedEmail
          },
          {
            enableRetry: true,
            enableFallback: true,
            maxRetryAttempts: 2
          }
        );

        if (recoveryResult.recovered) {
          emailLogger.logSuccess(
            'SINGLE_EMAIL_RECOVERY_SUCCESSFUL',
            undefined,
            undefined,
            {
              operationId,
              recipientEmail: sanitizedEmail,
              recoveryStrategy: recoveryResult.strategy,
              recoveryMessage: recoveryResult.message
            }
          );
          
          // If recovery was successful, we don't throw the error
          return;
        } else {
          emailLogger.logError(
            'SINGLE_EMAIL_RECOVERY_FAILED',
            emailError,
            undefined,
            undefined,
            sanitizedEmail,
            {
              operationId,
              recoveryStrategy: recoveryResult.strategy,
              recoveryMessage: recoveryResult.message,
              nextAction: recoveryResult.nextAction
            }
          );
        }
      } catch (recoveryError) {
        emailLogger.logError(
          'SINGLE_EMAIL_RECOVERY_ERROR',
          recoveryError instanceof EmailError ? recoveryError : 
            new EmailError("recoveryError.message", EmailErrorCode.UNKNOWN_ERROR),
          undefined,
          undefined,
          sanitizedEmail,
          { operationId, originalError: emailError.message }
        );
      }

      console.error('Error sending email to:', sanitizedEmail, emailError);
      throw emailError;
    }
  }

  /**
   * Send a single email (legacy method for backward compatibility)
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (typeof options.to === 'string') {
      return this.sendSingleEmail({
        to: options.to,
        subject: options.subject,
        html: options.html
      });
    } else {
      // Handle multiple recipients
      const emailPromises = options.to.map(email => 
        this.sendSingleEmail({
          to: email,
          subject: options.subject,
          html: options.html
        })
      );
      await Promise.all(emailPromises);
    }
  }

  /**
   * Send email to multiple users using a template with enhanced validation
   */
  async sendEmailToUsers(options: SendEmailToUsersOptions): Promise<void> {
    try {
      // Validate recipient limit
      if (!validateRecipientLimit(options.userIds)) {
        throw new EmailError(
          'Invalid recipient count. Must be between 1 and 10 recipients.',
          EMAIL_ERROR_CODES.RECIPIENT_LIMIT_EXCEEDED
        );
      }

      // Get the email template
      const template = await EmailTemplate.findById(options.templateId);
      if (!template) {
        throw new EmailError(
          'Email template not found',
          EMAIL_ERROR_CODES.TEMPLATE_NOT_FOUND
        );
      }

      // Get users and their profiles
      const users = await User.find({
        _id: { $in: options.userIds },
        del_flg: false
      });

      if (users.length === 0) {
        throw new EmailError(
          'No valid users found',
          EMAIL_ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Validate all user emails
      const userEmails = users.map(user => user.email);
      const emailValidation = validateEmails(userEmails);
      if (!emailValidation.valid) {
        throw new EmailError(
          `Invalid email addresses found: ${emailValidation.invalidEmails.join(', ')}`,
          EMAIL_ERROR_CODES.INVALID_EMAIL
        );
      }

      // Get buyer profiles for personalization
      const buyerProfiles = await BuyerProfile.find({
        userId: { $in: options.userIds },
        del_flg: false
      });

      // Create a map for quick profile lookup
      const profileMap = new Map();
      buyerProfiles.forEach(profile => {
        profileMap.set(profile.userId.toString(), profile);
      });

      // Send emails to each user sequentially to avoid overwhelming SMTP server
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const user of users) {
        try {
          const profile = profileMap.get(user._id.toString());
          const userName = profile?.name || user.email;

          // Prepare template data
          const templateData: TemplateData = {
            name: userName,
            email: user.email,
            point: profile?.point || 0
          };

          // Render template with placeholders
          const personalizedContent = renderTemplate(template.content, templateData);

          await this.sendSingleEmail({
            to: user.email,
            subject: template.title,
            html: personalizedContent
          });

          successCount++;
          
          // Small delay between emails to avoid overwhelming SMTP server
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          failureCount++;
          errors.push(`${user.email}: ${error.message}`);
          console.error(`Failed to send email to ${user.email}:`, error);
        }
      }

      console.log(`Email sending completed. Success: ${successCount}, Failed: ${failureCount}`);
      
      if (failureCount > 0) {
        console.warn('Some emails failed to send:', errors);
      }
    } catch (error) {
      console.error('Error sending emails to users:', error);
      throw error;
    }
  }

  /**
   * Send approval email to a user with enhanced validation
   */
  async sendApprovalEmail(userEmail: string, userName: string): Promise<void> {
    try {
      // Validate email address
      if (!validateEmail(userEmail)) {
        throw new EmailError(
          `Invalid email address: ${userEmail}`,
          EMAIL_ERROR_CODES.INVALID_EMAIL,
          400
        );
      }

      // Try to find an approval template (preferably default)
      const approvalTemplate = await EmailTemplate.findOne({
        type: 'approval',
        isDefault: true,
        del_flg: false
      }) || await EmailTemplate.findOne({
        type: 'approval',
        del_flg: false
      });

      let subject: string;
      let content: string;

      if (approvalTemplate) {
        subject = approvalTemplate.title;
        
        // Prepare template data
        const templateData: TemplateData = {
          name: userName,
          email: userEmail
        };
        
        // Render template with placeholders
        content = renderTemplate(approvalTemplate.content, templateData);
      } else {
        // Default approval email if no template exists
        subject = 'Account Approved - BanhMi App';
        content = `
          <h2>Account Approved</h2>
          <p>Dear ${userName},</p>
          <p>Your account has been approved! You can now use all features of the BanhMi App, including point-based payments.</p>
          <p>Thank you for joining us!</p>
          <p>Best regards,<br>BanhMi App Team</p>
        `;
      }

      await this.sendSingleEmail({
        to: userEmail,
        subject,
        html: content
      });
    } catch (error) {
      console.error('Error sending approval email:', error);
      throw error;
    }
  }

  /**
   * Send automated email for system events
   */
  async sendAutomatedEmail(
    templateType: string,
    recipientEmail: string,
    templateData: TemplateData
  ): Promise<void> {
    try {
      // Validate email address
      if (!validateEmail(recipientEmail)) {
        throw new EmailError(
          `Invalid email address: ${recipientEmail}`,
          EMAIL_ERROR_CODES.INVALID_EMAIL,
          400
        );
      }

      // Find template (preferably default)
      const template = await EmailTemplate.findOne({
        type: templateType,
        isDefault: true,
        del_flg: false
      }) || await EmailTemplate.findOne({
        type: templateType,
        del_flg: false
      });

      if (!template) {
        console.warn(`No template found for type: ${templateType}. Skipping automated email.`);
        return;
      }

      // Render template with provided data
      const personalizedContent = renderTemplate(template.content, templateData);

      const emailHistoryObj:EmailHistoryCreate = {
        templateId: template._id,
        templateTitle: template.title,
        templateContent: template.content,
        recipientCount: 1,
        successCount: 0,
        failureCount: 0,
        status: "sending",
        sentAt: new Date(),
      }

      if(this.adminId) {
        emailHistoryObj.sentBy = this.adminId
      }

      const emailHistory = new EmailHistory(emailHistoryObj);

      await emailHistory.save();

      await this.sendSingleEmail({
        to: recipientEmail,
        subject: template.title,
        html: personalizedContent
      });

      console.log(`Automated email sent successfully: ${templateType} to ${recipientEmail}`);
    } catch (error) {
      console.error(`Error sending automated email (${templateType}) to ${recipientEmail}:`, error);
      // Don't throw error for automated emails to avoid breaking main business processes
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        return false;
      }
      return await testEmailConnection(this.transporter);
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();