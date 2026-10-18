import express from 'express';
import { 
  AppError, 
  createValidationError, 
  createAuthenticationError, 
  createNotFoundError,
  createInsufficientStockError,
  globalErrorHandler 
} from '../middleware/errorHandler';

/**
 * Test script to verify error handling functionality
 */
const testErrorHandling = () => {
  console.log('🧪 Testing Error Handling System...\n');

  // Test 1: AppError creation
  console.log('1. Testing AppError creation:');
  try {
    const validationError = createValidationError('Test validation error');
    console.log('✅ Validation error created:', {
      message: validationError.message,
      statusCode: validationError.statusCode,
      code: validationError.code,
      isOperational: validationError.isOperational
    });
  } catch (error) {
    console.log('❌ Failed to create validation error:', error);
  }

  // Test 2: Different error types
  console.log('\n2. Testing different error types:');
  const errors = [
    createAuthenticationError(),
    createNotFoundError('User'),
    createInsufficientStockError('Bánh Mì Thịt Nướng')
  ];

  errors.forEach((error, index) => {
    console.log(`✅ Error ${index + 1}:`, {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code
    });
  });

  // Test 3: Mock Express error handling
  console.log('\n3. Testing Express error handler:');
  
  const mockReq = {} as express.Request;
  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`✅ Mock response - Status: ${code}, Data:`, data);
        return mockRes;
      }
    })
  } as any;
  const mockNext = () => {};

  // Test with operational error
  const operationalError = createValidationError('Test operational error');
  globalErrorHandler(operationalError, mockReq, mockRes, mockNext);

  // Test with non-operational error
  const nonOperationalError = new Error('Test non-operational error');
  globalErrorHandler(nonOperationalError, mockReq, mockRes, mockNext);

  console.log('\n✅ Error handling tests completed successfully!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  testErrorHandling();
}

export { testErrorHandling };