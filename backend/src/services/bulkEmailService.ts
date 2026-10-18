import { EmailHistory } from '../models/EmailHistory';
import { EmailRecipient } from '../models/EmailRecipient';
import { IEmailTemplate } from '../models/EmailTemplate';
import { emailService } from './emailService';
import { renderTemplate, TemplateData } from '../utils/templateRenderer';
import { 
  EmailError, 
  EmailErrorCode, 
  SendingError,
  classifyError,
  getRetryStrategy,
  calculateRetryDelay 
} from '../utils/emailErrors';
import { emailLogger } from './emailLoggingService';
import { emailHealthMonitor } from './emailHealthMonitor';
import { emailErrorRecoveryService } from './emailErrorRecoveryService';

interface BulkEmailRecipient {
  _id: string;
  email: string;
  name: string;
  point: number;
}

/**
 * Process bulk email sending sequentially with comprehensive error handling
 * This function handles the actual sending of emails to all recipients
 */
export const processBulkEmail = async (
  historyId: string,
  template: IEmailTemplate,
  recipients: BulkEmailRecipient[]
): Promise<void> => {
  let successCount = 0;
  let failureCount = 0;
  const errors: EmailError[] = [];
  const startTime = Date.now();

  emailLogger.logSuccess(
    'BULK_EMAIL_PROCESSING_STARTED',
    undefined,
    undefined,
    { historyId, recipientCount: recipients.length, templateId: template._id }
  );

  try {
    // Check if email service is healthy before starting
    if (!emailHealthMonitor.isServiceAvailable()) {
      throw new SendingError(
        'Email service is not available for bulk processing',
        EmailErrorCode.EMAIL_SERVICE_UNAVAILABLE,
        true,
        300 // retry after 5 minutes
      );
    }

    // Process each recipient sequentially
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const recipientNumber = i + 1;
      
      emailLogger.logSuccess(
        'BULK_EMAIL_RECIPIENT_PROCESSING',
        undefined,
        undefined,
        { 
          historyId, 
          recipientNumber, 
          totalRecipients: recipients.length, 
          recipientEmail: recipient.email 
        }
      );
      
      try {
        // Prepare template data for personalization
        const templateData: TemplateData = {
          name: recipient.name || recipient.email,
          email: recipient.email,
          point: recipient.point || 0,
          currentDate: new Date().toLocaleDateString('ja-JP'),
          systemName: 'BanhMi App'
        };

        // Render personalized content (this should match what was pre-rendered)
        const personalizedContent = renderTemplate(template.content, templateData);

        // Send email using email service with comprehensive error handling
        await emailService.sendSingleEmail({
          to: recipient.email,
          subject: template.title,
          html: personalizedContent
        });

        // Update recipient status to 'sent' with detailed information
        await EmailRecipient.findOneAndUpdate(
          {
            historyId,
            buyerId: recipient._id,
            del_flg: false
          },
          {
            status: 'sent',
            sentAt: new Date(),
            // Keep the pre-rendered content, don't overwrite it
            $unset: { error: 1 } // Remove any previous error if this is a retry
          }
        );

        successCount++;
        emailHealthMonitor.recordSuccess();
        
        emailLogger.logSuccess(
          'BULK_EMAIL_RECIPIENT_SUCCESS',
          undefined,
          undefined,
          { 
            historyId, 
            recipientEmail: recipient.email, 
            recipientNumber, 
            totalRecipients: recipients.length 
          }
        );

      } catch (error: any) {
        const emailError = classifyError(error);
        errors.push(emailError);
        
        // Record failure for health monitoring
        emailHealthMonitor.recordFailure(emailError);

        // Attempt recovery for individual recipient failure
        try {
          const recoveryResult = await emailErrorRecoveryService.recoverFromError(
            emailError,
            {
              operationId: `bulk_email_recipient_${historyId}_${recipient._id}`,
              recipientEmail: recipient.email,
              templateId: template._id.toString(),
              historyId
            },
            {
              enableRetry: true,
              enableFallback: true,
              maxRetryAttempts: 1 // Limited retries in bulk operations
            }
          );

          if (recoveryResult.recovered) {
            // Recovery successful - update status to sent
            await EmailRecipient.findOneAndUpdate(
              {
                historyId,
                buyerId: recipient._id,
                del_flg: false
              },
              {
                status: 'sent',
                sentAt: new Date(),
                $unset: { error: 1 },
                recoveryInfo: {
                  strategy: recoveryResult.strategy,
                  message: recoveryResult.message,
                  recoveredAt: new Date()
                }
              }
            );

            successCount++;
            
            emailLogger.logSuccess(
              'BULK_EMAIL_RECIPIENT_RECOVERED',
              undefined,
              undefined,
              { 
                historyId, 
                recipientEmail: recipient.email, 
                recipientNumber, 
                totalRecipients: recipients.length,
                recoveryStrategy: recoveryResult.strategy
              }
            );
          } else {
            // Recovery failed - mark as failed
            await EmailRecipient.findOneAndUpdate(
              {
                historyId,
                buyerId: recipient._id,
                del_flg: false
              },
              {
                status: 'failed',
                error: `${emailError.message} (Recovery failed: ${recoveryResult.message})`,
                sentAt: new Date(),
                recoveryInfo: {
                  attempted: true,
                  strategy: recoveryResult.strategy,
                  message: recoveryResult.message,
                  nextAction: recoveryResult.nextAction,
                  attemptedAt: new Date()
                }
              }
            );

            failureCount++;
            
            emailLogger.logError(
              'BULK_EMAIL_RECIPIENT_RECOVERY_FAILED',
              emailError,
              undefined,
              undefined,
              recipient.email,
              { 
                historyId, 
                recipientNumber, 
                totalRecipients: recipients.length,
                recoveryResult
              }
            );
          }
        } catch (recoveryError) {
          let message = '';
          if(recoveryError instanceof Error) {
            message = recoveryError.message
          }

          // Recovery attempt itself failed
          await EmailRecipient.findOneAndUpdate(
            {
              historyId,
              buyerId: recipient._id,
              del_flg: false
            },
            {
              status: 'failed',
              error: `${emailError.message} (Recovery error: ${message})`,
              sentAt: new Date()
            }
          );

          failureCount++;
          
          emailLogger.logError(
            'BULK_EMAIL_RECIPIENT_RECOVERY_ERROR',
            recoveryError instanceof EmailError ? recoveryError : 
              new EmailError(message, EmailErrorCode.UNKNOWN_ERROR),
            undefined,
            undefined,
            recipient.email,
            { 
              historyId, 
              recipientNumber, 
              totalRecipients: recipients.length,
              originalError: emailError.message
            }
          );
        }
      }

      // Update EmailHistory with current progress after each email
      await EmailHistory.findByIdAndUpdate(historyId, {
        successCount,
        failureCount
      });

      // Add 500ms delay between emails to avoid overwhelming SMTP server
      // Skip delay for the last recipient
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update EmailHistory with final counts and status
    const finalStatus = failureCount === 0 ? 'completed' : 'completed';
    await EmailHistory.findByIdAndUpdate(historyId, {
      successCount,
      failureCount,
      status: finalStatus,
      completedAt: new Date()
    });

    const duration = Date.now() - startTime;
    
    emailLogger.logBulkEmail(
      'BULK_EMAIL_PROCESSING_COMPLETED',
      'system',
      'system@banhmi.app',
      template._id.toString(),
      recipients.length,
      successCount,
      failureCount,
      duration,
      errors
    );

  } catch (error) {
    const emailError = classifyError(error);
    const duration = Date.now() - startTime;
    
    emailLogger.logError(
      'BULK_EMAIL_PROCESSING_CRITICAL_ERROR',
      emailError,
      undefined,
      undefined,
      undefined,
      { historyId, duration, successCount, failureCount }
    );
    
    // Update EmailHistory status to failed
    await EmailHistory.findByIdAndUpdate(historyId, {
      successCount,
      failureCount,
      status: 'failed',
      completedAt: new Date()
    });

    throw emailError;
  }
};

/**
 * Get bulk email sending progress
 * Returns current status and progress of a bulk email operation with detailed recipient information
 */
export const getBulkEmailProgress = async (historyId: string) => {
  try {
    const history = await EmailHistory.findById(historyId);
    if (!history) {
      throw new Error('Email history not found');
    }

    const recipients = await EmailRecipient.find({
      historyId,
      del_flg: false
    }).select('buyerId buyerName buyerEmail status error sentAt createdAt')
      .sort({ createdAt: 1 }); // Sort by creation order to show processing sequence

    const statusCounts = recipients.reduce((acc, recipient) => {
      acc[recipient.status] = (acc[recipient.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate progress percentage
    const totalRecipients = history.recipientCount;
    const processedCount = (statusCounts.sent || 0) + (statusCounts.failed || 0);
    const progressPercentage = totalRecipients > 0 ? Math.round((processedCount / totalRecipients) * 100) : 0;

    // Find currently processing recipient (if any)
    const currentlyProcessing = recipients.find(r => r.status === 'pending');

    // Get detailed recipient information for tracking
    const recipientDetails = recipients.map(r => ({
      buyerId: r.buyerId,
      buyerName: r.buyerName,
      buyerEmail: r.buyerEmail,
      status: r.status,
      error: r.error,
      sentAt: r.sentAt,
      createdAt: r.createdAt
    }));

    // Get failed recipients for potential resend
    const failedRecipients = recipients
      .filter(r => r.status === 'failed')
      .map(r => ({
        buyerId: r.buyerId,
        buyerName: r.buyerName,
        buyerEmail: r.buyerEmail,
        error: r.error
      }));

    return {
      historyId,
      status: history.status,
      templateTitle: history.templateTitle,
      sentAt: history.sentAt,
      completedAt: history.completedAt,
      
      // Progress tracking
      totalRecipients,
      processedCount,
      progressPercentage,
      
      // Status counts
      successCount: history.successCount,
      failureCount: history.failureCount,
      pendingCount: statusCounts.pending || 0,
      sentCount: statusCounts.sent || 0,
      failedCount: statusCounts.failed || 0,
      
      // Current processing status
      isComplete: history.status === 'completed' || history.status === 'failed',
      currentlyProcessing: currentlyProcessing ? {
        buyerName: currentlyProcessing.buyerName,
        buyerEmail: currentlyProcessing.buyerEmail
      } : null,
      
      // Detailed recipient information
      recipients: recipientDetails,
      failedRecipients,
      
      // Timing information
      estimatedTimeRemaining: history.status === 'sending' && statusCounts.pending ? 
        (statusCounts.pending * 0.5) : null, // Estimate based on 500ms delay per email
      
      // Summary statistics
      summary: {
        startedAt: history.sentAt,
        duration: history.completedAt ? 
          Math.round((new Date(history.completedAt).getTime() - new Date(history.sentAt).getTime()) / 1000) : 
          Math.round((new Date().getTime() - new Date(history.sentAt).getTime()) / 1000),
        successRate: totalRecipients > 0 ? 
          Math.round(((statusCounts.sent || 0) / totalRecipients) * 100) : 0
      }
    };
  } catch (error) {
    console.error('Error getting bulk email progress:', error);
    throw error;
  }
};