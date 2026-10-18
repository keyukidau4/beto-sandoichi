# Integration Tests for BanhMi App

This directory contains comprehensive integration tests that verify the end-to-end functionality of the BanhMi App backend API.

## Test Coverage

### 1. User Registration and Approval Flow (`userRegistrationApproval.test.ts`)
**Requirements Covered: 1.1-1.5**

- ✅ User registration with pending status
- ✅ Duplicate email prevention
- ✅ Login with pending status limitations
- ✅ Admin user approval workflow
- ✅ User blacklisting functionality
- ✅ Role-based authorization (admin, staff, buyer)
- ✅ Staff inventory access restrictions

### 2. Order Placement and Payment Flow (`orderPaymentFlow.test.ts`)
**Requirements Covered: 3.1-3.5, 4.1-4.5, 5.1-5.2**

- ✅ Shopping cart subtotal calculations with options
- ✅ パクチー (+50円) and チリソース (free) option handling
- ✅ Payment method restrictions for pending vs approved buyers
- ✅ COD payment for all users
- ✅ Point payment for approved users only
- ✅ Point balance validation
- ✅ Stock availability checking
- ✅ Automatic stock deduction
- ✅ Point earning system (100円 = 1 point)
- ✅ Order history and details access
- ✅ Order privacy (users can't see others' orders)

### 3. Admin Management Operations (`adminManagement.test.ts`)
**Requirements Covered: 2.1-2.3, 6.2-6.4, 7.1, 8.1-8.3, 9.1-9.2**

- ✅ Product CRUD operations (admin only)
- ✅ Product soft delete functionality
- ✅ User management and status updates
- ✅ Point management by admin
- ✅ Analytics data provision
- ✅ Top ordered and viewed products
- ✅ User registration statistics
- ✅ Staff inventory access
- ✅ Low stock warnings
- ✅ Contact request management
- ✅ Authorization enforcement

### 4. Email Management (`emailManagement.test.ts`)
**Requirements Covered: 7.2-7.5**

- ✅ Email template CRUD operations
- ✅ Email sending to specific users
- ✅ Email sending to users by status
- ✅ Template variable replacement ({{name}}, {{email}}, {{points}})
- ✅ Email service error handling
- ✅ Automated approval emails
- ✅ Authorization enforcement
- ✅ Email validation

### 5. Analytics Data Accuracy (`analyticsAccuracy.test.ts`)
**Requirements Covered: 8.1-8.5**

- ✅ Product view tracking accuracy
- ✅ Admin/staff view exclusion
- ✅ Order analytics calculation
- ✅ Completed orders only counting
- ✅ User registration statistics
- ✅ Role-based user filtering
- ✅ Point transaction tracking
- ✅ Real-time analytics updates
- ✅ Soft-deleted record handling
- ✅ Data consistency across queries

## Running the Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test environment variables
cp .env.example .env.test
```

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test Suite
```bash
# User registration and approval
npm test -- --testPathPattern="userRegistrationApproval"

# Order and payment flow
npm test -- --testPathPattern="orderPaymentFlow"

# Admin management
npm test -- --testPathPattern="adminManagement"

# Email management
npm test -- --testPathPattern="emailManagement"

# Analytics accuracy
npm test -- --testPathPattern="analyticsAccuracy"
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:integration:watch
```

## Test Architecture

### Database Setup
- Uses MongoDB Memory Server for isolated testing
- Each test suite has its own clean database state
- Automatic cleanup after each test

### Authentication
- Creates test users (admin, staff, buyer) for each suite
- Uses real JWT tokens for authentication testing
- Tests both authorized and unauthorized access

### Mocking
- Email service (nodemailer) is mocked to prevent actual email sending
- Cloudinary uploads are mocked in upload tests
- Rate limiting is disabled in test environment

### Data Integrity
- Tests verify database state changes
- Checks both API responses and direct database queries
- Validates soft delete functionality
- Ensures referential integrity

## Test Data Patterns

### User Creation
```typescript
const testUser = new User({
  email: 'test@example.com',
  password: '$2a$12$...', // bcrypt hash of 'password123'
  role: 'buyer',
  status: 'pending'
});
```

### Product Creation
```typescript
const testProduct = new Product({
  name: 'Test Product',
  type: 'banhmi',
  price: 500,
  stock: 10,
  options: [
    { name: 'パクチー', extraCost: 50 },
    { name: 'チリソース', extraCost: 0 }
  ]
});
```

### Order Creation
```typescript
const testOrder = new Order({
  buyerId: userId,
  items: [{
    productId: productId,
    quantity: 2,
    selectedOptions: ['パクチー'],
    subtotal: 1100 // (500 + 50) * 2
  }],
  paymentType: '代引き',
  totalAmount: 1100
});
```

## Error Scenarios Tested

- Invalid authentication tokens
- Insufficient permissions
- Duplicate data creation
- Invalid input validation
- Stock shortage scenarios
- Insufficient point balances
- Email service failures
- Database constraint violations

## Performance Considerations

- Tests run with `--runInBand` to prevent database conflicts
- 60-second timeout for complex integration scenarios
- Efficient test data cleanup
- Minimal test data creation

## Continuous Integration

These tests are designed to run in CI/CD environments:
- No external service dependencies (except mocked)
- Deterministic test results
- Comprehensive error reporting
- Coverage reporting integration

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure MongoDB Memory Server can start
   - Check available memory and ports

2. **Authentication Failures**
   - Verify JWT secret is set in test environment
   - Check cookie parsing in test requests

3. **Timeout Issues**
   - Increase test timeout for slow operations
   - Check for hanging database connections

4. **Mock Failures**
   - Verify mock implementations match real service APIs
   - Check mock reset between tests

### Debug Mode
```bash
# Run with verbose output
npm test -- --verbose --testPathPattern="integration"

# Run single test file
npm test -- src/test/integration/userRegistrationApproval.test.ts
```

## Contributing

When adding new integration tests:

1. Follow the existing test structure
2. Include proper setup/teardown
3. Test both success and failure scenarios
4. Verify database state changes
5. Add appropriate comments and documentation
6. Ensure tests are deterministic and isolated