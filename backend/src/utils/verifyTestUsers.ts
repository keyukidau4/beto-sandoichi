import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import bcrypt from 'bcryptjs';

config();

const verifyTestUsers = async () => {
  try {
    console.log('🔍 Verifying test users...\n');

    await connectDB();

    // Check buyer user
    const buyerUser = await User.findOne({ email: 'buyer@test.com' });
    if (buyerUser) {
      console.log('✅ Buyer user found:');
      console.log(`   Email: ${buyerUser.email}`);
      console.log(`   Role: ${buyerUser.role}`);
      console.log(`   Status: ${buyerUser.status}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('password123', buyerUser.password);
      console.log(`   Password valid: ${isPasswordValid ? '✅' : '❌'}`);

      // Check buyer profile
      const buyerProfile = await BuyerProfile.findOne({ userId: buyerUser._id });
      if (buyerProfile) {
        console.log(`   Profile: ✅ (Points: ${buyerProfile.point})`);
      } else {
        console.log(`   Profile: ❌ Not found`);
      }
    } else {
      console.log('❌ Buyer user not found');
    }

    // Check approved buyer user
    const approvedBuyerUser = await User.findOne({ email: 'approved-buyer@test.com' });
    if (approvedBuyerUser) {
      console.log('\n✅ Approved buyer user found:');
      console.log(`   Email: ${approvedBuyerUser.email}`);
      console.log(`   Role: ${approvedBuyerUser.role}`);
      console.log(`   Status: ${approvedBuyerUser.status}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('password123', approvedBuyerUser.password);
      console.log(`   Password valid: ${isPasswordValid ? '✅' : '❌'}`);

      // Check buyer profile
      const approvedBuyerProfile = await BuyerProfile.findOne({ userId: approvedBuyerUser._id });
      if (approvedBuyerProfile) {
        console.log(`   Profile: ✅ (Points: ${approvedBuyerProfile.point})`);
      } else {
        console.log(`   Profile: ❌ Not found`);
      }
    } else {
      console.log('❌ Approved buyer user not found');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  verifyTestUsers();
}

export default verifyTestUsers;