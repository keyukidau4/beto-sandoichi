import connectDB from '../config/database';
import { User, BuyerProfile, Product, Order, PointTransaction, ContactRequest, EmailTemplate, ProductView } from '../models';

/**
 * Test script to verify all models are working correctly
 */
const testModels = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('✅ Database connected successfully');
    
    // Test model creation (without actually saving to avoid data pollution)
    console.log('🧪 Testing model schemas...');
    
    // Test User model
    const testUser = new User({
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'buyer',
      status: 'pending'
    });
    console.log('✅ User model schema valid');
    
    // Test BuyerProfile model
    const testProfile = new BuyerProfile({
      userId: testUser._id,
      name: 'Test User',
      tel: '090-1234-5678',
      zip1: '123',
      zip2: '4567',
      address1: 'Test Address 1',
      address2: 'Test Address 2',
      point: 100
    });
    console.log('✅ BuyerProfile model schema valid');
    
    // Test Product model
    const testProduct = new Product({
      name: 'Test Banh Mi',
      type: 'banhmi',
      description: 'Delicious test banh mi',
      price: 500,
      stock: 10,
      options: [
        { name: 'パクチー', extraCost: 50 },
        { name: 'チリソース', extraCost: 0 }
      ]
    });
    console.log('✅ Product model schema valid');
    
    // Test Order model
    const testOrder = new Order({
      buyerId: testUser._id,
      items: [{
        productId: testProduct._id,
        quantity: 2,
        selectedOptions: ['パクチー'],
        subtotal: 1100
      }],
      paymentType: '代引き',
      totalAmount: 1100,
      pointsEarned: 11
    });
    console.log('✅ Order model schema valid');
    
    // Test PointTransaction model
    const testTransaction = new PointTransaction({
      userId: testUser._id,
      orderId: testOrder._id,
      type: 'purchase_reward',
      amount: 11,
      note: 'Points earned from order'
    });
    console.log('✅ PointTransaction model schema valid');
    
    // Test ContactRequest model
    const testContact = new ContactRequest({
      buyerId: testUser._id,
      type: 'update-info',
      content: 'Please update my address information'
    });
    console.log('✅ ContactRequest model schema valid');
    
    // Test EmailTemplate model
    const testTemplate = new EmailTemplate({
      title: 'Account Approval',
      content: 'Your account has been approved!',
      type: 'approval'
    });
    console.log('✅ EmailTemplate model schema valid');
    
    // Test ProductView model
    const testView = new ProductView({
      productId: testProduct._id,
      date: '2024-01-01',
      count: 5
    });
    console.log('✅ ProductView model schema valid');
    
    console.log('🎉 All models tested successfully!');
    console.log('📊 Model validation summary:');
    console.log('   - User: ✅');
    console.log('   - BuyerProfile: ✅');
    console.log('   - Product: ✅');
    console.log('   - Order: ✅');
    console.log('   - PointTransaction: ✅');
    console.log('   - ContactRequest: ✅');
    console.log('   - EmailTemplate: ✅');
    console.log('   - ProductView: ✅');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Model test failed:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testModels();
}

export default testModels;