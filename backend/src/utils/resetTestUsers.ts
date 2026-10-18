import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { Order } from '../models/Order';
import { PointTransaction } from '../models/PointTransaction';

config();

const resetTestUsers = async () => {
  try {
    console.log('🔄 Resetting test users...\n');

    await connectDB();

    // Delete existing test users and related data
    const testEmails = ['buyer@test.com', 'approved-buyer@test.com', 'admin@test.com'];
    
    for (const email of testEmails) {
      const user = await User.findOne({ email });
      if (user) {
        // Delete related data
        await BuyerProfile.deleteMany({ userId: user._id });
        await Order.deleteMany({ buyerId: user._id });
        await PointTransaction.deleteMany({ userId: user._id });
        
        // Delete user
        await User.deleteOne({ _id: user._id });
        console.log(`✅ Deleted user: ${email}`);
      }
    }

    console.log('\n🎉 Test users reset complete. Run createTestUsers.ts to recreate them.');

  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  resetTestUsers();
}

export default resetTestUsers;