/**
 * Template rendering utility for email placeholders
 */

// Available placeholders with their descriptions
export const AVAILABLE_PLACEHOLDERS = {
  // User data
  '{{name}}': 'Buyer name',
  '{{email}}': 'Buyer email address',
  '{{point}}': 'Current point balance',
  
  // Order data (for order-related emails)
  '{{orderNumber}}': 'Order number/ID',
  '{{totalAmount}}': 'Total order amount',
  '{{orderStatus}}': 'Current order status',
  
  // System data
  '{{currentDate}}': 'Current date in Japanese format',
  '{{systemName}}': 'System name (BanhMi App)'
};

// Interface for template data
export interface TemplateData {
  // User data
  name?: string;
  email?: string;
  point?: number;
  
  // Order data
  orderNumber?: string;
  totalAmount?: number;
  orderStatus?: string;
  
  // System data (automatically populated)
  currentDate?: string;
  systemName?: string;
  
  // Additional custom data
  [key: string]: any;
}

/**
 * Render template with placeholder replacement
 */
export const renderTemplate = (template: string, data: TemplateData): string => {
  if (!template || typeof template !== 'string') {
    return '';
  }

  let rendered = template;
  
  // Prepare data with defaults
  const templateData: TemplateData = {
    ...data,
    currentDate: data.currentDate || new Date().toLocaleDateString('ja-JP'),
    systemName: data.systemName || 'BanhMi App'
  };

  // Replace all placeholders
  Object.entries(AVAILABLE_PLACEHOLDERS).forEach(([placeholder, description]) => {
    const key = placeholder.replace(/[{}]/g, ''); // Remove {{ }}
    const value = templateData[key];
    
    if (value !== undefined && value !== null) {
      let formattedValue = String(value);
      
      // Special formatting for certain fields
      if (key === 'totalAmount' && typeof value === 'number') {
        formattedValue = value.toLocaleString('ja-JP');
      }
      
      // Simple string replacement - more reliable than regex for this use case
      rendered = rendered.split(placeholder).join(formattedValue);
    }
  });

  return rendered;
};

/**
 * Extract placeholders from template content
 */
export const extractPlaceholders = (content: string): string[] => {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const placeholders: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = `{{${match[1].trim()}}}`;
    if (!placeholders.includes(placeholder)) {
      placeholders.push(placeholder);
    }
  }

  return placeholders;
};

/**
 * Validate placeholders in template content
 */
export const validatePlaceholders = (content: string): { 
  valid: boolean; 
  invalidPlaceholders: string[];
  validPlaceholders: string[];
  totalPlaceholders: number;
} => {
  if (!content || typeof content !== 'string') {
    return {
      valid: true,
      invalidPlaceholders: [],
      validPlaceholders: [],
      totalPlaceholders: 0
    };
  }

  const extractedPlaceholders = extractPlaceholders(content);
  const availablePlaceholderKeys = Object.keys(AVAILABLE_PLACEHOLDERS);
  
  const validPlaceholders: string[] = [];
  const invalidPlaceholders: string[] = [];

  extractedPlaceholders.forEach(placeholder => {
    if (availablePlaceholderKeys.includes(placeholder)) {
      validPlaceholders.push(placeholder);
    } else {
      invalidPlaceholders.push(placeholder);
    }
  });

  return {
    valid: invalidPlaceholders.length === 0,
    invalidPlaceholders,
    validPlaceholders,
    totalPlaceholders: extractedPlaceholders.length
  };
};

/**
 * Get sample data for template preview
 */
export const getSampleTemplateData = (): TemplateData => {
  return {
    name: '田中太郎',
    email: 'tanaka@example.com',
    point: 1500,
    orderNumber: 'ORD-2024-001',
    totalAmount: 2800,
    orderStatus: '配送中',
    currentDate: new Date().toLocaleDateString('ja-JP'),
    systemName: 'BanhMi App'
  };
};

/**
 * Render template with sample data for preview
 */
export const renderTemplatePreview = (template: string): string => {
  const sampleData = getSampleTemplateData();
  return renderTemplate(template, sampleData);
};

/**
 * Get placeholder help text
 */
export const getPlaceholderHelp = (): Array<{ placeholder: string; description: string }> => {
  return Object.entries(AVAILABLE_PLACEHOLDERS).map(([placeholder, description]) => ({
    placeholder,
    description
  }));
};

/**
 * Validate individual placeholder format
 */
export const isValidPlaceholderFormat = (placeholder: string): boolean => {
  if (!placeholder || typeof placeholder !== 'string') {
    return false;
  }
  
  // Check if placeholder follows {{key}} format
  const placeholderRegex = /^\{\{[a-zA-Z][a-zA-Z0-9_]*\}\}$/;
  return placeholderRegex.test(placeholder.trim());
};

/**
 * Get detailed placeholder analysis for template content
 */
export const analyzePlaceholders = (content: string): {
  analysis: {
    totalFound: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
  };
  placeholders: {
    valid: Array<{ placeholder: string; description: string; count: number }>;
    invalid: Array<{ placeholder: string; reason: string; count: number }>;
  };
} => {
  if (!content || typeof content !== 'string') {
    return {
      analysis: { totalFound: 0, validCount: 0, invalidCount: 0, duplicateCount: 0 },
      placeholders: { valid: [], invalid: [] }
    };
  }

  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const foundPlaceholders: { [key: string]: number } = {};
  let match;

  // Count all placeholder occurrences
  while ((match = placeholderRegex.exec(content)) !== null) {
    const placeholder = `{{${match[1].trim()}}}`;
    foundPlaceholders[placeholder] = (foundPlaceholders[placeholder] || 0) + 1;
  }

  const availablePlaceholders = AVAILABLE_PLACEHOLDERS;
  const validPlaceholders: Array<{ placeholder: string; description: string; count: number }> = [];
  const invalidPlaceholders: Array<{ placeholder: string; reason: string; count: number }> = [];

  Object.entries(foundPlaceholders).forEach(([placeholder, count]) => {
    if (availablePlaceholders[placeholder as keyof typeof availablePlaceholders]) {
      validPlaceholders.push({
        placeholder,
        description: availablePlaceholders[placeholder as keyof typeof availablePlaceholders],
        count
      });
    } else {
      let reason = 'Unknown placeholder';
      if (!isValidPlaceholderFormat(placeholder)) {
        reason = 'Invalid placeholder format';
      }
      invalidPlaceholders.push({
        placeholder,
        reason,
        count
      });
    }
  });

  const totalFound = Object.values(foundPlaceholders).reduce((sum, count) => sum + count, 0);
  const duplicateCount = totalFound - Object.keys(foundPlaceholders).length;

  return {
    analysis: {
      totalFound,
      validCount: validPlaceholders.reduce((sum, p) => sum + p.count, 0),
      invalidCount: invalidPlaceholders.reduce((sum, p) => sum + p.count, 0),
      duplicateCount
    },
    placeholders: {
      valid: validPlaceholders,
      invalid: invalidPlaceholders
    }
  };
};