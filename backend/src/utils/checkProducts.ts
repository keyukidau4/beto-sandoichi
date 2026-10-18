import mongoose from 'mongoose';
import { Product } from '../models/Product';
import connectDB from '../config/database';

async function checkProducts() {
  try {
    await connectDB();
    
    const products = await Product.find({});
    console.log('📦 Products found:', products.length);
    
    if (products.length === 0) {
      console.log('\n🔧 Creating sample products...');
      
      const sampleProducts = [
        {
          name: 'クラシックバインミー',
          type: 'banhmi',
          description: '伝統的なベトナムバインミー',
          price: 500,
          stock: 10,
          options: [
            { name: 'パクチー', extraCost: 50 },
            { name: 'チリソース', extraCost: 0 }
          ]
        },
        {
          name: 'ベトナムコーヒー',
          type: 'drink',
          description: '濃厚なベトナムコーヒー',
          price: 300,
          stock: 2, // Low stock for testing
          options: []
        },
        {
          name: 'スペシャルバインミー',
          type: 'banhmi',
          description: 'スペシャル具材のバインミー',
          price: 700,
          stock: 0, // Out of stock for testing
          options: [
            { name: 'パクチー', extraCost: 50 },
            { name: 'チリソース', extraCost: 0 }
          ]
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    } else {
      products.forEach(product => {
        console.log(`  - ${product.name} (stock: ${product.stock})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkProducts();