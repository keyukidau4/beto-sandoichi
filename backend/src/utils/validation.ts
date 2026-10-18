import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name is required',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required'
    }),
  
  tel: Joi.string()
    .pattern(/^[0-9-+().\s]+$/)
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.min': 'Phone number must be at least 10 characters',
      'string.max': 'Phone number must not exceed 20 characters',
      'any.required': 'Phone number is required'
    }),
  
  zip1: Joi.string()
    .pattern(/^[0-9]{3}$/)
    .required()
    .messages({
      'string.pattern.base': 'Zip code (first part) must be 3 digits',
      'any.required': 'Zip code (first part) is required'
    }),
  
  zip2: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Zip code (second part) must be 4 digits',
      'any.required': 'Zip code (second part) is required'
    }),
  
  address1: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Address (prefecture/city) is required',
      'string.max': 'Address (prefecture/city) must not exceed 200 characters',
      'any.required': 'Address (prefecture/city) is required'
    }),
  
  address2: Joi.string()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Address (detailed) must not exceed 200 characters'
    })
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Product validation schema
export const productSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Product name is required',
      'string.max': 'Product name must not exceed 100 characters',
      'any.required': 'Product name is required'
    }),
  
  type: Joi.string()
    .valid('banhmi', 'drink')
    .required()
    .messages({
      'any.only': 'Product type must be either "banhmi" or "drink"',
      'any.required': 'Product type is required'
    }),
  
  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
    }),
  
  stock: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Stock must be a whole number',
      'number.min': 'Stock cannot be negative',
      'any.required': 'Stock is required'
    }),
  
  options: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          'any.required': 'Option name is required'
        }),
        extraCost: Joi.number().min(0).required().messages({
          'number.min': 'Extra cost cannot be negative',
          'any.required': 'Extra cost is required'
        })
      })
    )
    .default([]),
  
  imageUrl: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Image URL must be a valid URL'
    })
});

// Order validation schema
export const orderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid product ID format'
          }),
        quantity: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.integer': 'Quantity must be a whole number',
            'number.positive': 'Quantity must be positive'
          }),
        selectedOptions: Joi.array()
          .items(Joi.string())
          .default([])
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Order items are required'
    }),
  
  paymentType: Joi.string()
    .valid('代引き', 'ポイント')
    .required()
    .messages({
      'any.only': 'Payment type must be either "代引き" or "ポイント"',
      'any.required': 'Payment type is required'
    })
});

// Contact request validation schema
export const contactRequestSchema = Joi.object({
  type: Joi.string()
    .valid('update-info', 'general-inquiry', 'complaint')
    .required()
    .messages({
      'any.only': 'Contact type must be one of: update-info, general-inquiry, complaint',
      'any.required': 'Contact type is required'
    }),
  
  content: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Content is required',
      'string.max': 'Content must not exceed 1000 characters',
      'any.required': 'Content is required'
    })
});

// Email template validation schema
export const emailTemplateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Title is required',
      'string.max': 'Title must not exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  content: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Content is required',
      'any.required': 'Content is required'
    }),
  
  type: Joi.string()
    .valid('approval', 'general', 'promotion', 'order_confirmation', 'status_update', 'point_notification')
    .required()
    .messages({
      'any.only': 'Email type must be one of: approval, general, promotion, order_confirmation, status_update, point_notification',
      'any.required': 'Email type is required'
    })
});

// Validation helper functions
export const validateRegister = (data: any) => {
  return registerSchema.validate(data, { abortEarly: false });
};

export const validateLogin = (data: any) => {
  return loginSchema.validate(data, { abortEarly: false });
};

export const validateProduct = (data: any) => {
  return productSchema.validate(data, { abortEarly: false });
};

export const validateOrder = (data: any) => {
  return orderSchema.validate(data, { abortEarly: false });
};

export const validateContactRequest = (data: any) => {
  return contactRequestSchema.validate(data, { abortEarly: false });
};

export const validateEmailTemplate = (data: any) => {
  return emailTemplateSchema.validate(data, { abortEarly: false });
};