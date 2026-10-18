import { 
  validateRegister, 
  validateLogin, 
  validateProduct, 
  validateOrder,
  validateContactRequest,
  validateEmailTemplate
} from '../validation';

describe('Validation Utils', () => {
  describe('validateRegister', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      tel: '123-456-7890',
      zip1: '123',
      zip2: '4567',
      address1: 'Test Address 1',
      address2: 'Test Address 2'
    };

    it('should validate correct registration data', () => {
      const { error, value } = validateRegister(validRegistrationData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validRegistrationData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const { error } = validateRegister(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email');
    });

    it('should reject short password', () => {
      const invalidData = {
        ...validRegistrationData,
        password: '123'
      };

      const { error } = validateRegister(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('6 characters');
    });

    it('should reject missing required fields', () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'password123'
        // Missing name, tel, addresses
      };

      const { error } = validateRegister(incompleteData);
      
      expect(error).toBeDefined();
    });

    it('should reject empty name', () => {
      const invalidData = {
        ...validRegistrationData,
        name: ''
      };

      const { error } = validateRegister(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('name');
    });

    it('should reject invalid phone number format', () => {
      const invalidData = {
        ...validRegistrationData,
        tel: '123'
      };

      const { error } = validateRegister(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject invalid zip code format', () => {
      const invalidData = {
        ...validRegistrationData,
        zip1: '12345' // Should be 3 digits
      };

      const { error } = validateRegister(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject empty addresses', () => {
      const invalidData = {
        ...validRegistrationData,
        address1: ''
      };

      const { error } = validateRegister(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should accept whitespace in string fields (no trimming)', () => {
      const dataWithWhitespace = {
        ...validRegistrationData,
        email: 'test@example.com',
        name: '  Test User  '
      };

      const { error, value } = validateRegister(dataWithWhitespace);
      
      expect(error).toBeUndefined();
      expect(value.name).toBe('  Test User  ');
    });
  });

  describe('validateLogin', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should validate correct login data', () => {
      const { error, value } = validateLogin(validLoginData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validLoginData);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validLoginData,
        email: 'invalid-email'
      };

      const { error } = validateLogin(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('valid email');
    });

    it('should accept any password length for login', () => {
      const validData = {
        ...validLoginData,
        password: '123'
      };

      const { error } = validateLogin(validData);
      
      expect(error).toBeUndefined();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123'
      };

      const { error } = validateLogin(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const { error } = validateLogin(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should accept valid email without trimming', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error, value } = validateLogin(validData);
      
      expect(error).toBeUndefined();
      expect(value.email).toBe('test@example.com');
    });
  });

  describe('validateProduct', () => {
    const validProductData = {
      name: 'Test Banh Mi',
      type: 'banhmi',
      description: 'Test description',
      price: 500,
      stock: 10,
      options: [
        { name: 'パクチー', extraCost: 50 },
        { name: 'チリソース', extraCost: 0 }
      ]
    };

    it('should validate correct product data', () => {
      const { error, value } = validateProduct(validProductData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validProductData);
    });

    it('should reject invalid product type', () => {
      const invalidData = {
        ...validProductData,
        type: 'invalid-type'
      };

      const { error } = validateProduct(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('banhmi');
    });

    it('should reject negative price', () => {
      const invalidData = {
        ...validProductData,
        price: -100
      };

      const { error } = validateProduct(invalidData);
      
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('positive');
    });

    it('should reject negative stock', () => {
      const invalidData = {
        ...validProductData,
        stock: -5
      };

      const { error } = validateProduct(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should validate options array', () => {
      const invalidData = {
        ...validProductData,
        options: [
          { name: 'パクチー', extraCost: -10 } // Negative cost
        ]
      };

      const { error } = validateProduct(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should allow empty options array', () => {
      const validData = {
        ...validProductData,
        options: []
      };

      const { error } = validateProduct(validData);
      
      expect(error).toBeUndefined();
    });

    it('should reject empty product name', () => {
      const invalidData = {
        ...validProductData,
        name: ''
      };

      const { error } = validateProduct(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject zero price', () => {
      const invalidData = {
        ...validProductData,
        price: 0
      };

      const { error } = validateProduct(invalidData);
      
      expect(error).toBeDefined();
    });
  });

  describe('validateOrder', () => {
    const validOrderData = {
      items: [{
        productId: '507f1f77bcf86cd799439011',
        quantity: 2,
        selectedOptions: ['パクチー']
      }],
      paymentType: '代引き'
    };

    it('should validate correct order data', () => {
      const { error, value } = validateOrder(validOrderData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validOrderData);
    });

    it('should reject invalid payment type', () => {
      const invalidData = {
        ...validOrderData,
        paymentType: 'invalid-payment'
      };

      const { error } = validateOrder(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject empty items array', () => {
      const invalidData = {
        ...validOrderData,
        items: []
      };

      const { error } = validateOrder(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject invalid productId format', () => {
      const invalidData = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0],
          productId: 'invalid-id'
        }]
      };

      const { error } = validateOrder(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject zero or negative quantity', () => {
      const invalidData = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0],
          quantity: 0
        }]
      };

      const { error } = validateOrder(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should accept valid order items without subtotal', () => {
      const validData = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0]
        }]
      };

      const { error } = validateOrder(validData);
      
      expect(error).toBeUndefined();
    });

    it('should accept order without totalAmount field', () => {
      const validData = {
        ...validOrderData
      };

      const { error } = validateOrder(validData);
      
      expect(error).toBeUndefined();
    });

    it('should validate point payment type', () => {
      const pointOrderData = {
        ...validOrderData,
        paymentType: 'ポイント'
      };

      const { error } = validateOrder(pointOrderData);
      
      expect(error).toBeUndefined();
    });

    it('should validate multiple items', () => {
      const multiItemData = {
        ...validOrderData,
        items: [
          validOrderData.items[0],
          {
            productId: '507f1f77bcf86cd799439012',
            quantity: 1,
            selectedOptions: []
          }
        ]
      };

      const { error } = validateOrder(multiItemData);
      
      expect(error).toBeUndefined();
    });
  });

  describe('validateContactRequest', () => {
    const validContactData = {
      type: 'update-info',
      content: 'Please update my address information'
    };

    it('should validate correct contact request data', () => {
      const { error, value } = validateContactRequest(validContactData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validContactData);
    });

    it('should reject invalid contact type', () => {
      const invalidData = {
        ...validContactData,
        type: 'invalid-type'
      };

      const { error } = validateContactRequest(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject empty content', () => {
      const invalidData = {
        ...validContactData,
        content: ''
      };

      const { error } = validateContactRequest(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should validate all contact types', () => {
      const types = ['update-info', 'general-inquiry', 'complaint'];
      
      types.forEach(type => {
        const data = {
          type,
          content: 'Test content'
        };

        const { error } = validateContactRequest(data);
        expect(error).toBeUndefined();
      });
    });

    it('should reject very long content', () => {
      const invalidData = {
        ...validContactData,
        content: 'a'.repeat(1001) // Max length is 1000
      };

      const { error } = validateContactRequest(invalidData);
      
      expect(error).toBeDefined();
    });
  });

  describe('validateEmailTemplate', () => {
    const validTemplateData = {
      title: 'Welcome Email',
      content: 'Welcome to our service!',
      type: 'general'
    };

    it('should validate correct email template data', () => {
      const { error, value } = validateEmailTemplate(validTemplateData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validTemplateData);
    });

    it('should reject empty title', () => {
      const invalidData = {
        ...validTemplateData,
        title: ''
      };

      const { error } = validateEmailTemplate(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject empty content', () => {
      const invalidData = {
        ...validTemplateData,
        content: ''
      };

      const { error } = validateEmailTemplate(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should reject invalid template type', () => {
      const invalidData = {
        ...validTemplateData,
        type: 'invalid-type'
      };

      const { error } = validateEmailTemplate(invalidData);
      
      expect(error).toBeDefined();
    });

    it('should validate all template types', () => {
      const types = ['approval', 'general', 'promotion'];
      
      types.forEach(type => {
        const data = {
          ...validTemplateData,
          type
        };

        const { error } = validateEmailTemplate(data);
        expect(error).toBeUndefined();
      });
    });

    it('should accept whitespace in title and content', () => {
      const dataWithWhitespace = {
        title: '  Welcome Email  ',
        content: '  Welcome to our service!  ',
        type: 'general'
      };

      const { error, value } = validateEmailTemplate(dataWithWhitespace);
      
      expect(error).toBeUndefined();
      expect(value.title).toBe('  Welcome Email  ');
      expect(value.content).toBe('  Welcome to our service!  ');
    });
  });
});