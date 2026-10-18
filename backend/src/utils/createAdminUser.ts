import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

/**
 * Create admin user for testing
 */
const createAdminUser = async () => {
  try {
    console.log('🔧 Creating admin user for testing...\n');

    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`📧 Email: admin@test.com`);
      console.log(`🔑 Password: admin123`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log(`📊 Status: ${existingAdmin.status}\n`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      status: 'approved'
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: admin@test.com`);
    console.log(`🔑 Password: admin123`);
    console.log(`👤 Role: ${adminUser.role}`);
    console.log(`📊 Status: ${adminUser.status}\n`);

    console.log('🎉 Admin user is ready for testing image upload functionality!');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

export default createAdminUser;