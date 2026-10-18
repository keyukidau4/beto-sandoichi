/**
 * Unit tests for template renderer utility
 */

import {
  renderTemplate,
  renderTemplatePreview,
  extractPlaceholders,
  validatePlaceholders,
  getSampleTemplateData,
  AVAILABLE_PLACEHOLDERS,
  analyzePlaceholders,
  isValidPlaceholderFormat,
  getPlaceholderHelp
} from '../templateRenderer';

describe('Template Renderer Utility', () => {
  describe('renderTemplate', () => {
    it('should render template with all placeholders correctly', () => {
      const template = `
        Hello {{name}},
        Your email: {{email}}
        Points: {{point}}
        Order: {{orderNumber}}
        Amount: {{totalAmount}}
        Status: {{orderStatus}}
        Date: {{currentDate}}
        System: {{systemName}}
      `;

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        point: 100,
        orderNumber: 'ORD-123',
        totalAmount: 2500,
        orderStatus: 'shipped',
        currentDate: '2024/01/01',
        systemName: 'Test App'
      };

      const result = renderTemplate(template, data);

      expect(result).toContain('Hello John Doe,');
      expect(result).toContain('Your email: john@example.com');
      expect(result).toContain('Points: 100');
      expect(result).toContain('Order: ORD-123');
      expect(result).toContain('Amount: 2500');
      expect(result).toContain('Status: shipped');
      expect(result).toContain('Date: 2024/01/01');
      expect(result).toContain('System: Test App');
    });

    it('should handle missing data gracefully', () => {
      const template = 'Hello {{name}}, your points: {{point}}';
      const data = { name: 'John' }; // missing point

      const result = renderTemplate(template, data);

      expect(result).toContain('Hello John,');
      expect(result).toContain('your points: {{point}}'); // Placeholder remains
    });

    it('should handle empty template', () => {
      const result = renderTemplate('', { name: 'John' });
      expect(result).toBe('');
    });

    it('should handle null/undefined template', () => {
      expect(renderTemplate(null as any, { name: 'John' })).toBe('');
      expect(renderTemplate(undefined as any, { name: 'John' })).toBe('');
    });

    it('should auto-populate system data', () => {
      const template = 'Welcome to {{systemName}} on {{currentDate}}';
      const result = renderTemplate(template, {});

      expect(result).toContain('Welcome to BanhMi App on');
      expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/); // Japanese date format
    });
  });

  describe('renderTemplatePreview', () => {
    it('should render template with sample data', () => {
      const template = 'Hello {{name}}, you have {{point}} points';
      const result = renderTemplatePreview(template);

      expect(result).toContain('Hello 田中太郎,');
      expect(result).toContain('you have 1500 points');
    });

    it('should handle empty template in preview', () => {
      const result = renderTemplatePreview('');
      expect(result).toBe('');
    });
  });

  describe('extractPlaceholders', () => {
    it('should extract all placeholders from template', () => {
      const template = 'Hello {{name}}, your {{email}} and {{point}} points';
      const placeholders = extractPlaceholders(template);

      expect(placeholders).toEqual(['{{name}}', '{{email}}', '{{point}}']);
    });

    it('should handle duplicate placeholders', () => {
      const template = 'Hello {{name}}, {{name}} has {{point}} points';
      const placeholders = extractPlaceholders(template);

      expect(placeholders).toEqual(['{{name}}', '{{point}}']);
    });

    it('should handle malformed placeholders', () => {
      const template = 'Hello {name}, {{email}} and {{{point}}}';
      const placeholders = extractPlaceholders(template);

      expect(placeholders).toEqual(['{{email}}', '{{{point}}']);
    });

    it('should handle empty content', () => {
      expect(extractPlaceholders('')).toEqual([]);
      expect(extractPlaceholders(null as any)).toEqual([]);
      expect(extractPlaceholders(undefined as any)).toEqual([]);
    });
  });

  describe('validatePlaceholders', () => {
    it('should validate all valid placeholders', () => {
      const template = 'Hello {{name}}, your {{email}} and {{point}} points';
      const validation = validatePlaceholders(template);

      expect(validation.valid).toBe(true);
      expect(validation.validPlaceholders).toEqual(['{{name}}', '{{email}}', '{{point}}']);
      expect(validation.invalidPlaceholders).toEqual([]);
      expect(validation.totalPlaceholders).toBe(3);
    });

    it('should identify invalid placeholders', () => {
      const template = 'Hello {{name}}, your {{invalidPlaceholder}} and {{anotherInvalid}}';
      const validation = validatePlaceholders(template);

      expect(validation.valid).toBe(false);
      expect(validation.validPlaceholders).toEqual(['{{name}}']);
      expect(validation.invalidPlaceholders).toEqual(['{{invalidPlaceholder}}', '{{anotherInvalid}}']);
      expect(validation.totalPlaceholders).toBe(3);
    });

    it('should handle empty content', () => {
      const validation = validatePlaceholders('');

      expect(validation.valid).toBe(true);
      expect(validation.validPlaceholders).toEqual([]);
      expect(validation.invalidPlaceholders).toEqual([]);
      expect(validation.totalPlaceholders).toBe(0);
    });
  });

  describe('getSampleTemplateData', () => {
    it('should return sample data with all required fields', () => {
      const sampleData = getSampleTemplateData();

      expect(sampleData.name).toBe('田中太郎');
      expect(sampleData.email).toBe('tanaka@example.com');
      expect(sampleData.point).toBe(1500);
      expect(sampleData.orderNumber).toBe('ORD-2024-001');
      expect(sampleData.totalAmount).toBe(2800);
      expect(sampleData.orderStatus).toBe('配送中');
      expect(sampleData.systemName).toBe('BanhMi App');
      expect(sampleData.currentDate).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
    });
  });

  describe('analyzePlaceholders', () => {
    it('should provide detailed placeholder analysis', () => {
      const template = 'Hello {{name}}, {{name}}, your {{email}} and {{invalidPlaceholder}}';
      const analysis = analyzePlaceholders(template);

      expect(analysis.analysis.totalFound).toBe(4);
      expect(analysis.analysis.validCount).toBe(3); // name appears twice + email
      expect(analysis.analysis.invalidCount).toBe(1);
      expect(analysis.analysis.duplicateCount).toBe(1); // name appears twice

      expect(analysis.placeholders.valid).toHaveLength(2); // name and email
      expect(analysis.placeholders.invalid).toHaveLength(1); // invalidPlaceholder

      const nameEntry = analysis.placeholders.valid.find(p => p.placeholder === '{{name}}');
      expect(nameEntry?.count).toBe(2);
    });

    it('should handle empty content in analysis', () => {
      const analysis = analyzePlaceholders('');

      expect(analysis.analysis.totalFound).toBe(0);
      expect(analysis.analysis.validCount).toBe(0);
      expect(analysis.analysis.invalidCount).toBe(0);
      expect(analysis.analysis.duplicateCount).toBe(0);
      expect(analysis.placeholders.valid).toEqual([]);
      expect(analysis.placeholders.invalid).toEqual([]);
    });
  });

  describe('isValidPlaceholderFormat', () => {
    it('should validate correct placeholder formats', () => {
      expect(isValidPlaceholderFormat('{{name}}')).toBe(true);
      expect(isValidPlaceholderFormat('{{email}}')).toBe(true);
      expect(isValidPlaceholderFormat('{{orderNumber}}')).toBe(true);
      expect(isValidPlaceholderFormat('{{point_balance}}')).toBe(true);
    });

    it('should reject invalid placeholder formats', () => {
      expect(isValidPlaceholderFormat('{name}')).toBe(false);
      expect(isValidPlaceholderFormat('{{{name}}}')).toBe(false);
      expect(isValidPlaceholderFormat('{{name')).toBe(false);
      expect(isValidPlaceholderFormat('name}}')).toBe(false);
      expect(isValidPlaceholderFormat('{{123name}}')).toBe(false); // starts with number
      expect(isValidPlaceholderFormat('{{name-invalid}}')).toBe(false); // contains dash
      expect(isValidPlaceholderFormat('')).toBe(false);
      expect(isValidPlaceholderFormat(null as any)).toBe(false);
    });
  });

  describe('getPlaceholderHelp', () => {
    it('should return placeholder help information', () => {
      const help = getPlaceholderHelp();

      expect(Array.isArray(help)).toBe(true);
      expect(help.length).toBeGreaterThan(0);

      const nameHelp = help.find(h => h.placeholder === '{{name}}');
      expect(nameHelp).toBeDefined();
      expect(nameHelp?.description).toBe('Buyer name');

      const emailHelp = help.find(h => h.placeholder === '{{email}}');
      expect(emailHelp).toBeDefined();
      expect(emailHelp?.description).toBe('Buyer email address');
    });
  });

  describe('AVAILABLE_PLACEHOLDERS constant', () => {
    it('should contain all expected placeholders', () => {
      const expectedPlaceholders = [
        '{{name}}',
        '{{email}}',
        '{{point}}',
        '{{orderNumber}}',
        '{{totalAmount}}',
        '{{orderStatus}}',
        '{{currentDate}}',
        '{{systemName}}'
      ];

      expectedPlaceholders.forEach(placeholder => {
        expect(AVAILABLE_PLACEHOLDERS).toHaveProperty(placeholder);
      });
    });

    it('should have descriptions for all placeholders', () => {
      Object.entries(AVAILABLE_PLACEHOLDERS).forEach(([placeholder, description]) => {
        expect(typeof placeholder).toBe('string');
        expect(typeof description).toBe('string');
        expect(placeholder.startsWith('{{')).toBe(true);
        expect(placeholder.endsWith('}}')).toBe(true);
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle Japanese content correctly', () => {
      const template = 'こんにちは、{{name}}様。現在のポイント: {{point}}ポイント';
      const data = { name: '田中太郎', point: 1500 };
      const result = renderTemplate(template, data);

      expect(result).toBe('こんにちは、田中太郎様。現在のポイント: 1500ポイント');
    });

    it('should handle HTML content correctly', () => {
      const template = '<h1>Hello {{name}}</h1><p>Points: <strong>{{point}}</strong></p>';
      const data = { name: 'John', point: 100 };
      const result = renderTemplate(template, data);

      expect(result).toBe('<h1>Hello John</h1><p>Points: <strong>100</strong></p>');
    });

    it('should handle special characters in data', () => {
      const template = 'Hello {{name}}, your email is {{email}}';
      const data = { name: 'John & Jane', email: 'test+user@example.com' };
      const result = renderTemplate(template, data);

      expect(result).toContain('John & Jane');
      expect(result).toContain('test+user@example.com');
    });

    it('should handle numeric values correctly', () => {
      const template = 'Points: {{point}}, Amount: {{totalAmount}}';
      const data = { point: 0, totalAmount: 1000.50 };
      const result = renderTemplate(template, data);

      expect(result).toBe('Points: 0, Amount: 1000.5');
    });
  });
});