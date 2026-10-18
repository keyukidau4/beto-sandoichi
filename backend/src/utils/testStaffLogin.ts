import mongoose from 'mongoose';
import { User } from '../models/User';
import connectDB from '../config/database';

async function testStaffLogin() {
  try {
    await connectDB();
    
    // Find staff user
    const staffUser = await User.findOne({ email: 'staff@test.com' });
    
    if (!staffUser) {
      console.log('❌ Staff user not found');
      return;
    }
    
    console.log('📋 Staff user found:', {
      email: staffUser.email,
      role: staffUser.role,
      status: staffUser.status
    });
    
    // Test password
    const isValidPassword = await staffUser.comparePassword('password123');
    console.log('🔐 Password test result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('\n🔧 Updating staff user password...');
      staffUser.password = 'password123';
      await staffUser.save();
      console.log('✅ Password updated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testStaffLogin();