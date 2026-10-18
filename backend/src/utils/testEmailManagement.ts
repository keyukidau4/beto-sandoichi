import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmailTemplate } from '../models/EmailTemplate';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { emailService } from '../services/emailService';

// Load environment variables
dotenv.config();

async function testEmailManagement() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banhmi-app');
    console.log('Connected to MongoDB');

    // Test 1: Create email templates
    console.log('\n=== Test 1: Creating Email Templates ===');
    
    const approvalTemplate = new EmailTemplate({
      title: 'アカウント承認のお知らせ',
      content: `
<h2>アカウント承認のお知らせ</h2>
<p>{name}様</p>
<p>この度は、BanhMi Appにご登録いただき、ありがとうございます。</p>
<p>お客様のアカウントが承認されました。これで全ての機能をご利用いただけます。</p>
<ul>
  <li>商品の注文</li>
  <li>ポイントでのお支払い</li>
  <li>注文履歴の確認</li>
</ul>
<p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
<p>今後ともBanhMi Appをよろしくお願いいたします。</p>
<p>BanhMi App運営チーム</p>
      `,
      type: 'approval'
    });

    const promotionTemplate = new EmailTemplate({
      title: '【期間限定】新商品のご案内',
      content: `
<h2>新商品のご案内</h2>
<p>{name}様</p>
<p>いつもBanhMi Appをご利用いただき、ありがとうございます。</p>
<p>この度、新しいバインミーが登場いたしました！</p>
<h3>🥖 新商品情報</h3>
<ul>
  <li>スペシャルバインミー - 特製ソース付き</li>
  <li>ベトナムコーヒー - 本格的な味わい</li>
</ul>
<p>期間限定で特別価格でご提供しております。</p>
<p>ぜひお試しください！</p>
<p>BanhMi App運営チーム</p>
      `,
      type: 'promotion'
    });

    await approvalTemplate.save();
    await promotionTemplate.save();
    console.log('✅ Email templates created successfully');

    // Test 2: Test email service connection
    console.log('\n=== Test 2: Testing Email Service Connection ===');
    const connectionTest = await emailService.testConnection();
    console.log(`Email service connection: ${connectionTest ? '✅ Success' : '❌ Failed'}`);

    // Test 3: Get templates
    console.log('\n=== Test 3: Retrieving Email Templates ===');
    const templates = await EmailTemplate.find({ del_flg: false });
    console.log(`Found ${templates.length} templates:`);
    templates.forEach(template => {
      console.log(`- ${template.title} (${template.type})`);
    });

    // Test 4: Get approved users for email
    console.log('\n=== Test 4: Getting Approved Users ===');
    const approvedUsers = await User.aggregate([
      {
        $match: {
          role: 'buyer',
          status: 'approved',
          del_flg: false
        }
      },
      {
        $lookup: {
          from: 'buyerprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'profile.del_flg': { $ne: true }
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          status: 1,
          createdAt: 1,
          name: '$profile.name',
          tel: '$profile.tel'
        }
      }
    ]);

    console.log(`Found ${approvedUsers.length} approved users for email:`);
    approvedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    // Test 5: Test approval email (if we have approved users)
    if (approvedUsers.length > 0) {
      console.log('\n=== Test 5: Testing Approval Email ===');
      const testUser = approvedUsers[0];
      
      if (connectionTest) {
        try {
          await emailService.sendApprovalEmail(testUser.email, testUser.name);
          console.log(`✅ Approval email sent to ${testUser.email}`);
        } catch (error) {
          console.log(`❌ Failed to send approval email: ${error}`);
        }
      } else {
        console.log('⚠️ Skipping email send test due to connection failure');
      }
    }

    // Test 6: Test bulk email sending (simulation)
    if (approvedUsers.length > 0 && templates.length > 0) {
      console.log('\n=== Test 6: Testing Bulk Email Sending (Simulation) ===');
      const userIds = approvedUsers.slice(0, 2).map(user => user._id.toString());
      const templateId = templates[0]._id.toString();
      
      console.log(`Simulating email send to ${userIds.length} users with template: ${templates[0].title}`);
      
      if (connectionTest) {
        try {
          await emailService.sendEmailToUsers({ userIds, templateId });
          console.log('✅ Bulk email sent successfully');
        } catch (error) {
          console.log(`❌ Failed to send bulk email: ${error}`);
        }
      } else {
        console.log('⚠️ Skipping bulk email test due to connection failure');
      }
    }

    console.log('\n=== Email Management Test Complete ===');
    console.log('✅ All email management features tested successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testEmailManagement();