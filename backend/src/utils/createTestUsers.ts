import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { Product } from '../models/Product';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

/**
 * Create test users and products for testing order endpoints
 */
const createTestUsers = async () => {
  try {
    console.log('🔧 Creating test users and products for order testing...\n');

    // Connect to database
    await connectDB();

    // Create admin user
    let adminUser = await User.findOne({ email: 'admin@test.com' });
    if (!adminUser) {
      adminUser = new User({
        email: 'admin@test.com',
        password: 'admin123', // Let the pre-save hook handle hashing
        role: 'admin',
        status: 'approved'
      });
      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create buyer user
    let buyerUser = await User.findOne({ email: 'buyer@test.com' });
    if (!buyerUser) {
      buyerUser = new User({
        email: 'buyer@test.com',
        password: 'password123', // Let the pre-save hook handle hashing
        role: 'buyer',
        status: 'pending' // Start as pending to test approval flow
      });
      await buyerUser.save();
      console.log('✅ Buyer user created');

      // Create buyer profile
      const buyerProfile = new BuyerProfile({
        userId: buyerUser._id,
        name: 'Test Buyer',
        tel: '090-1234-5678',
        zip1: '123',
        zip2: '4567',
        address1: 'Tokyo, Shibuya',
        address2: 'Test Building 101',
        point: 1000 // Give some initial points for testing
      });
      await buyerProfile.save();
      console.log('✅ Buyer profile created with 1000 points');
    } else {
      console.log('✅ Buyer user already exists');
    }

    // Create approved buyer user for point payment testing
    let approvedBuyerUser = await User.findOne({ email: 'approved-buyer@test.com' });
    if (!approvedBuyerUser) {
      approvedBuyerUser = new User({
        email: 'approved-buyer@test.com',
        password: 'password123', // Let the pre-save hook handle hashing
        role: 'buyer',
        status: 'approved'
      });
      await approvedBuyerUser.save();
      console.log('✅ Approved buyer user created');

      // Create buyer profile
      const approvedBuyerProfile = new BuyerProfile({
        userId: approvedBuyerUser._id,
        name: 'Approved Test Buyer',
        tel: '090-9876-5432',
        zip1: '987',
        zip2: '6543',
        address1: 'Tokyo, Shinjuku',
        address2: 'Test Building 202',
        point: 2000 // Give more points for testing
      });
      await approvedBuyerProfile.save();
      console.log('✅ Approved buyer profile created with 2000 points');
    } else {
      console.log('✅ Approved buyer user already exists');
    }

    // Create test products
    const testProducts = [
      {
        name: 'Test Bánh Mì',
        type: 'banhmi',
        description: 'Test bánh mì for order testing',
        price: 500,
        stock: 10,
        options: [
          { name: 'パクチー', extraCost: 50 },
          { name: 'チリソース', extraCost: 0 }
        ]
      },
      {
        name: 'Test Drink',
        type: 'drink',
        description: 'Test drink for order testing',
        price: 200,
        stock: 20,
        options: []
      }
    ];

    for (const productData of testProducts) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        const product = new Product(productData);
        await product.save();
        console.log(`✅ Test product created: ${productData.name}`);
      } else {
        console.log(`✅ Test product already exists: ${productData.name}`);
      }
    }

    console.log('\n🎉 Test users and products are ready!');
    console.log('\nTest Accounts:');
    console.log('📧 Admin: admin@test.com / admin123');
    console.log('📧 Buyer (pending): buyer@test.com / password123');
    console.log('📧 Buyer (approved): approved-buyer@test.com / password123');

  } catch (error) {
    console.error('❌ Failed to create test users:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createTestUsers();
}

export default createTestUsers;