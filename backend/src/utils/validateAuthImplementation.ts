/**
 * Comprehensive validation script to verify that Task 7 requirements are fully implemented
 * Requirements: 1.1, 1.2, 6.1, 10.1
 */

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  requirement?: string;
}

class AuthImplementationValidator {
  private results: ValidationResult[] = [];

  private addResult(passed: boolean, message: string, requirement?: string) {
    this.results.push({ passed, message, requirement });
  }

  private checkFileExists(filePath: string, description: string): boolean {
    const exists = fs.existsSync(path.join(__dirname, '..', filePath));
    this.addResult(exists, `${description}: ${exists ? 'EXISTS' : 'MISSING'}`);
    return exists;
  }

  private checkFunctionExists(filePath: string, functionName: string, description: string, requirement?: string): boolean {
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
      const exists = content.includes(`export const ${functionName}`) || content.includes(`const ${functionName}`);
      this.addResult(exists, `${description}: ${exists ? 'IMPLEMENTED' : 'MISSING'}`, requirement);
      return exists;
    } catch (error) {
      this.addResult(false, `${description}: FILE NOT READABLE`, requirement);
      return false;
    }
  }

  private checkRouteExists(routePath: string, method: string, endpoint: string, description: string, requirement?: string): boolean {
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', routePath), 'utf8');
      const routePattern = `router.${method}('${endpoint}'`;
      const exists = content.includes(routePattern);
      this.addResult(exists, `${description}: ${exists ? 'IMPLEMENTED' : 'MISSING'}`, requirement);
      return exists;
    } catch (error) {
      this.addResult(false, `${description}: FILE NOT READABLE`, requirement);
      return false;
    }
  }

  private checkImplementationDetails(filePath: string, patterns: string[], description: string, requirement?: string): boolean {
    try {
      const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
      const allExist = patterns.every(pattern => content.includes(pattern));
      this.addResult(allExist, `${description}: ${allExist ? 'IMPLEMENTED' : 'INCOMPLETE'}`, requirement);
      return allExist;
    } catch (error) {
      this.addResult(false, `${description}: FILE NOT READABLE`, requirement);
      return false;
    }
  }

  public validateTask7Implementation(): void {
    console.log('🔍 Validating Task 7: Implement authentication API endpoints\n');

    // Check core files exist
    console.log('📁 Checking core files:');
    this.checkFileExists('controllers/authController.ts', 'Auth Controller');
    this.checkFileExists('routes/auth.ts', 'Auth Routes');
    this.checkFileExists('middleware/auth.ts', 'Auth Middleware');
    this.checkFileExists('utils/validation.ts', 'Validation Utils');
    this.checkFileExists('models/User.ts', 'User Model');
    this.checkFileExists('models/BuyerProfile.ts', 'BuyerProfile Model');

    console.log('\n🎯 Checking Task 7 Sub-requirements:\n');

    // Sub-requirement 1: POST /api/auth/register endpoint with buyer profile creation
    console.log('1️⃣  POST /api/auth/register endpoint with buyer profile creation');
    this.checkRouteExists('routes/auth.ts', 'post', '/register', 'Register route defined', '1.1, 6.1');
    this.checkFunctionExists('controllers/authController.ts', 'register', 'Register controller function', '1.1, 6.1');
    this.checkImplementationDetails('controllers/authController.ts', [
      'new User(',
      'role: \'buyer\'',
      'status: \'pending\'',
      'new BuyerProfile(',
      'userId: user._id'
    ], 'Register creates user with buyer role and profile', '1.1, 6.1');

    // Sub-requirement 2: POST /api/auth/login endpoint with JWT cookie setting
    console.log('\n2️⃣  POST /api/auth/login endpoint with JWT cookie setting');
    this.checkRouteExists('routes/auth.ts', 'post', '/login', 'Login route defined', '1.2');
    this.checkFunctionExists('controllers/authController.ts', 'login', 'Login controller function', '1.2');
    this.checkImplementationDetails('controllers/authController.ts', [
      'jwt.sign(',
      'res.cookie(',
      'httpOnly: true',
      'comparePassword'
    ], 'Login sets JWT cookie with proper security', '1.2, 10.1');

    // Sub-requirement 3: POST /api/auth/logout endpoint with cookie clearing
    console.log('\n3️⃣  POST /api/auth/logout endpoint with cookie clearing');
    this.checkRouteExists('routes/auth.ts', 'post', '/logout', 'Logout route defined', '1.2');
    this.checkFunctionExists('controllers/authController.ts', 'logout', 'Logout controller function', '1.2');
    this.checkImplementationDetails('controllers/authController.ts', [
      'res.clearCookie(',
      'token-banhmi'
    ], 'Logout clears authentication cookie', '1.2');

    // Sub-requirement 4: GET /api/auth/me endpoint for user info retrieval
    console.log('\n4️⃣  GET /api/auth/me endpoint for user info retrieval');
    this.checkRouteExists('routes/auth.ts', 'get', '/me', 'Get current user route defined', '1.2');
    this.checkFunctionExists('controllers/authController.ts', 'getCurrentUser', 'Get current user controller function', '1.2');
    this.checkImplementationDetails('routes/auth.ts', [
      'authenticate',
      'getCurrentUser'
    ], 'Me endpoint is protected with authentication', '1.2, 10.1');

    // Sub-requirement 5: Input validation and error handling
    console.log('\n5️⃣  Input validation and error handling');
    this.checkFunctionExists('utils/validation.ts', 'validateRegister', 'Register validation function', '10.1');
    this.checkFunctionExists('utils/validation.ts', 'validateLogin', 'Login validation function', '10.1');
    this.checkImplementationDetails('controllers/authController.ts', [
      'validateRegister(',
      'validateLogin(',
      'error.details',
      'try {',
      'catch (error)'
    ], 'Controllers use validation and error handling', '10.1');

    // Additional security checks (Requirement 10.1)
    console.log('\n🛡️  Security implementation checks:');
    this.checkImplementationDetails('models/User.ts', [
      'bcrypt.hash(',
      'bcrypt.compare(',
      'bcrypt.genSalt(12)'
    ], 'Password hashing with bcrypt (salt rounds 12)', '10.1');
    
    this.checkImplementationDetails('middleware/auth.ts', [
      'jwt.verify(',
      'req.cookies[\'token-banhmi\']',
      'status === \'blacklisted\''
    ], 'JWT verification and blacklist checking', '10.1');

    this.checkImplementationDetails('controllers/authController.ts', [
      'httpOnly: true',
      'secure: isProduction',
      'sameSite:'
    ], 'Secure cookie configuration', '10.1');

    // Role-based authorization (Requirement 1.1, 1.2)
    console.log('\n👥 Role-based authorization checks:');
    this.checkFunctionExists('middleware/auth.ts', 'authorize', 'Role-based authorization middleware', '1.1, 1.2');
    this.checkFunctionExists('middleware/auth.ts', 'requireApprovedBuyer', 'Approved buyer middleware', '1.1, 1.2');

    // Soft delete implementation (Requirement 10.1)
    console.log('\n🗑️  Soft delete implementation:');
    this.checkImplementationDetails('models/User.ts', [
      'del_flg: {',
      'default: false',
      'del_flg: { $ne: true }'
    ], 'User model soft delete implementation', '10.1');
    
    this.checkImplementationDetails('models/BuyerProfile.ts', [
      'del_flg: {',
      'default: false',
      'del_flg: { $ne: true }'
    ], 'BuyerProfile model soft delete implementation', '10.1');

    this.printResults();
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`\n✅ Passed: ${passed}/${total} (${percentage}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}\n`);

    // Group by requirement
    const byRequirement: { [key: string]: ValidationResult[] } = {};
    this.results.forEach(result => {
      const req = result.requirement || 'General';
      if (!byRequirement[req]) byRequirement[req] = [];
      byRequirement[req].push(result);
    });

    Object.keys(byRequirement).forEach(req => {
      console.log(`📋 ${req}:`);
      byRequirement[req].forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`  ${icon} ${result.message}`);
      });
      console.log('');
    });

    // Overall assessment
    if (percentage >= 95) {
      console.log('🎉 EXCELLENT: Task 7 implementation is complete and meets all requirements!');
    } else if (percentage >= 80) {
      console.log('✅ GOOD: Task 7 implementation is mostly complete with minor issues.');
    } else if (percentage >= 60) {
      console.log('⚠️  NEEDS WORK: Task 7 implementation has significant gaps.');
    } else {
      console.log('❌ INCOMPLETE: Task 7 implementation needs major work.');
    }

    console.log('\n📝 Task 7 Summary:');
    console.log('• POST /api/auth/register - User registration with buyer profile creation');
    console.log('• POST /api/auth/login - User login with JWT cookie setting');
    console.log('• POST /api/auth/logout - User logout with cookie clearing');
    console.log('• GET /api/auth/me - Get current user info (protected route)');
    console.log('• Input validation and comprehensive error handling');
    console.log('• Security: bcrypt password hashing, JWT tokens, httpOnly cookies');
    console.log('• Role-based authorization and user status checking');
    console.log('• Soft delete functionality for data protection');
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run validation
if (require.main === module) {
  const validator = new AuthImplementationValidator();
  validator.validateTask7Implementation();
}

export { AuthImplementationValidator };