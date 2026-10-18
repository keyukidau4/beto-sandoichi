import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';
import connectDB from '../config/database';
import logger from '../utils/logger';

// Default email templates for automated emails
const DEFAULT_TEMPLATES = [
  {
    title: 'アカウント承認のお知らせ',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">{{name}}様</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          この度は、BanhMi Appにご登録いただき、ありがとうございます。
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          お客様のアカウントが承認されました。
        </p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 16px; margin: 0; color: #495057;">
            <strong>現在のポイント残高:</strong> {{point}}ポイント
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          アプリにログインして、美味しいバインミーをお楽しみください。
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          今後ともよろしくお願いいたします。
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6c757d; text-align: center;">
          {{systemName}}<br>
          {{currentDate}}
        </p>
      </div>
    `,
    type: 'approval' as const,
    placeholders: ['name', 'point', 'systemName', 'currentDate'],
    isDefault: true
  },
  
  {
    title: 'ご注文確認',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">{{name}}様</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ご注文ありがとうございます。
        </p>
        
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px;">ご注文詳細</h3>
          
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>注文番号:</strong> {{orderNumber}}
          </p>
          
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>合計金額:</strong> ¥{{totalAmount}}
          </p>
          
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>注文状況:</strong> {{orderStatus}}
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ご注文の詳細は、アプリでご確認ください。
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          商品の準備ができ次第、お知らせいたします。
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6c757d; text-align: center;">
          {{systemName}}<br>
          {{currentDate}}
        </p>
      </div>
    `,
    type: 'order_confirmation' as const,
    placeholders: ['name', 'orderNumber', 'totalAmount', 'orderStatus', 'systemName', 'currentDate'],
    isDefault: true
  },
  
  {
    title: 'ポイント更新のお知らせ',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">{{name}}様</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ポイントが更新されました。
        </p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">ポイント残高</h3>
          
          <p style="font-size: 20px; margin: 0; color: #856404; font-weight: bold;">
            {{point}}ポイント
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ポイントをご活用いただき、お得にバインミーをお楽しみください。
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ポイントの詳細は、アプリでご確認いただけます。
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6c757d; text-align: center;">
          {{systemName}}<br>
          {{currentDate}}
        </p>
      </div>
    `,
    type: 'point_notification' as const,
    placeholders: ['name', 'point', 'systemName', 'currentDate'],
    isDefault: true
  },
  
  {
    title: '注文ステータス更新',
    content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">{{name}}様</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ご注文のステータスが更新されました。
        </p>
        
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h3 style="color: #0c5460; margin-top: 0; margin-bottom: 15px;">注文情報</h3>
          
          <p style="font-size: 16px; margin: 10px 0; color: #0c5460;">
            <strong>注文番号:</strong> {{orderNumber}}
          </p>
          
          <p style="font-size: 16px; margin: 10px 0; color: #0c5460;">
            <strong>現在のステータス:</strong> {{orderStatus}}
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          詳細な情報は、アプリでご確認ください。
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          ご不明な点がございましたら、お気軽にお問い合わせください。
        </p>
        
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #6c757d; text-align: center;">
          {{systemName}}<br>
          {{currentDate}}
        </p>
      </div>
    `,
    type: 'status_update' as const,
    placeholders: ['name', 'orderNumber', 'orderStatus', 'systemName', 'currentDate'],
    isDefault: true
  }
];

async function seedDefaultEmailTemplates() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database for seeding default email templates');

    // Check if default templates already exist
    const existingTemplates = await EmailTemplate.find({ isDefault: true });
    
    if (existingTemplates.length > 0) {
      logger.info(`Found ${existingTemplates.length} existing default templates. Skipping seed.`);
      return;
    }

    // Insert default templates
    const insertedTemplates = await EmailTemplate.insertMany(DEFAULT_TEMPLATES);
    
    logger.info(`Successfully seeded ${insertedTemplates.length} default email templates:`);
    insertedTemplates.forEach(template => {
      logger.info(`- ${template.type}: ${template.title}`);
    });

  } catch (error) {
    logger.error('Error seeding default email templates:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDefaultEmailTemplates()
    .then(() => {
      logger.info('Default email templates seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Default email templates seeding failed:', error);
      process.exit(1);
    });
}

export { seedDefaultEmailTemplates, DEFAULT_TEMPLATES };