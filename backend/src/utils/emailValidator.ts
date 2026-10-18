import validator from 'validator';

/**
 * Validate a single email address
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return validator.isEmail(email.trim());
};

/**
 * Validate multiple email addresses
 */
export const validateEmails = (emails: string[]): { valid: boolean; invalidEmails: string[] } => {
  if (!Array.isArray(emails)) {
    return { valid: false, invalidEmails: [] };
  }
  
  const invalidEmails: string[] = [];
  
  emails.forEach(email => {
    if (!validateEmail(email)) {
      invalidEmails.push(email);
    }
  });
  
  return {
    valid: invalidEmails.length === 0,
    invalidEmails
  };
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
};

/**
 * Validate recipient limit
 */
export const validateRecipientLimit = (recipients: string[], maxLimit: number = 10): boolean => {
  return Array.isArray(recipients) && recipients.length > 0 && recipients.length <= maxLimit;
};