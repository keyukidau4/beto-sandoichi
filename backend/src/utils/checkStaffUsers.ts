import mongoose from 'mongoose';
import { User } from '../models/User';
import connectDB from '../config/database';

async function checkStaffUsers() {
  try {
    await connectDB();
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log('📋 Staff users found:', staffUsers.length);
    
    staffUsers.forEach(user => {
      console.log(`  - ${user.email} (status: ${user.status})`);
    });
    
    // If no staff users, create one
    if (staffUsers.length === 0) {
      console.log('\n🔧 Creating new staff user...');
      
      const newStaff = new User({
        email: 'staff@banhmi.com',
        password: 'staff123',
        role: 'staff',
        status: 'approved'
      });
      
      await newStaff.save();
      console.log('✅ Staff user created:', newStaff.email);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkStaffUsers();