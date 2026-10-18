import mongoose from 'mongoose';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { EmailTemplate } from '../models/EmailTemplate';

const testUserApprovalSystem = async () => {
  try {
    console.log('🧪 Testing User Approval System...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banhmi-app');
    console.log('✅ Connected to database');

    // Create test email template if it doesn't exist
    const existingTemplate = await EmailTemplate.findOne({ type: 'approval' });
    if (!existingTemplate) {
      await EmailTemplate.create({
        title: 'アカウント承認のお知らせ - BanhMi App',
        content: `
          <h2>アカウント承認のお知らせ</h2>
          <p>{name}様</p>
          <p>この度は、BanhMi Appにご登録いただき、ありがとうございます。</p>
          <p>お客様のアカウント（{email}）が承認されました。</p>
          <p>今後ともBanhMi Appをよろしくお願いいたします。</p>
          <br>
          <p>BanhMi App運営チーム</p>
        `,
        type: 'approval'
      });
      console.log('✅ Created approval email template');
    }

    // Create test users
    const testUsers = [
      {
        email: 'test-buyer1@example.com',
        password: 'password123',
        role: 'buyer' as const,
        status: 'pending' as const
      },
      {
        email: 'test-buyer2@example.com',
        password: 'password123',
        role: 'buyer' as const,
        status: 'pending' as const
      },
      {
        email: 'test-buyer3@example.com',
        password: 'password123',
        role: 'buyer' as const,
        status: 'pending' as const
      }
    ];

    // Clean up existing test users
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    await BuyerProfile.deleteMany({ 
      userId: { $in: await User.find({ email: { $in: testUsers.map(u => u.email) } }).distinct('_id') }
    });

    // Create new test users
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await User.create(userData);
      
      // Create buyer profile
      await BuyerProfile.create({
        userId: user._id,
        name: `テストユーザー${createdUsers.length + 1}`,
        tel: '090-1234-5678',
        zip1: '123',
        zip2: '4567',
        address1: '東京都渋谷区',
        address2: 'テスト町1-2-3',
        point: 0
      });

      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} test users`);

    // Test user statistics
    const stats = await User.aggregate([
      { $match: { del_flg: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('📊 User Statistics:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    // Test bulk status update
    const userIds = createdUsers.map(u => u._id);
    const updateResult = await User.updateMany(
      { _id: { $in: userIds.slice(0, 2) } },
      { status: 'approved' }
    );

    console.log(`✅ Bulk approved ${updateResult.modifiedCount} users`);

    // Test blacklisting
    await User.findByIdAndUpdate(userIds[2], { status: 'blacklisted' });
    console.log('✅ Blacklisted 1 user');

    // Final statistics
    const finalStats = await User.aggregate([
      { $match: { del_flg: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('📊 Final User Statistics:');
    finalStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    // Test user search functionality
    const searchResults = await User.find({
      $or: [
        { email: { $regex: 'test-buyer', $options: 'i' } },
      ],
      del_flg: false
    }).select('-password');

    console.log(`🔍 Search results: Found ${searchResults.length} users matching 'test-buyer'`);

    console.log('✅ User Approval System test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testUserApprovalSystem();
}

export default testUserApprovalSystem;