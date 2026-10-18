import { config } from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { PointTransaction } from '../models/PointTransaction';

// Load environment variables
config();

/**
 * Test order functionality directly with database operations
 */
const testOrderAPI = async () => {
  try {
    console.log('🧪 Testing Order API functionality...\n');

    // Connect to database
    await connectDB();

    // Get test data
    const buyerUser = await User.findOne({ email: 'buyer@test.com' });
    const approvedBuyerUser = await User.findOne({ email: 'approved-buyer@test.com' });
    const testProduct = await Product.findOne({ name: 'Test Bánh Mì' });

    if (!buyerUser || !approvedBuyerUser || !testProduct) {
      console.log('❌ Test data not found. Please run createTestUsers.ts first');
      return;
    }

    console.log('✅ Test data found');
    console.log(`📧 Buyer: ${buyerUser.email} (${buyerUser.status})`);
    console.log(`📧 Approved Buyer: ${approvedBuyerUser.email} (${approvedBuyerUser.status})`);
    console.log(`🥖 Test Product: ${testProduct.name} (Stock: ${testProduct.stock})`);

    // Test 1: Create order with COD payment (pending buyer)
    console.log('\n1. Testing COD order creation for pending buyer...');
    try {
      const buyerProfile = await BuyerProfile.findOne({ userId: buyerUser._id });
      const initialPoints = buyerProfile?.point || 0;

      const orderData = {
        buyerId: buyerUser._id,
        items: [
          {
            productId: testProduct._id,
            quantity: 2,
            selectedOptions: ['パクチー'],
            subtotal: (testProduct.price + 50) * 2 // 500 + 50 = 550 per item, 2 items = 1100
          }
        ],
        paymentType: '代引き',
        totalAmount: 1100,
        pointsUsed: 0,
        pointsEarned: Math.floor(1100 / 100), // 11 points
        status: 'pending'
      };

      const order = new Order(orderData);
      await order.save();

      // Update product stock
      await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -2 } });

      // Add points to buyer profile
      await BuyerProfile.findByIdAndUpdate(buyerProfile!._id, { $inc: { point: orderData.pointsEarned } });

      // Create point transaction
      await PointTransaction.create({
        userId: buyerUser._id,
        orderId: order._id,
        type: 'purchase_reward',
        amount: orderData.pointsEarned,
        note: `Points earned from order ${order._id}`
      });

      console.log('✅ COD order created successfully');
      console.log(`   Order ID: ${order._id}`);
      console.log(`   Total: ¥${order.totalAmount}`);
      console.log(`   Points earned: ${order.pointsEarned}`);
      console.log(`   Buyer points: ${initialPoints} → ${initialPoints + orderData.pointsEarned}`);

    } catch (error) {
      console.log('❌ COD order creation failed:', error);
    }

    // Test 2: Test point payment validation for approved buyer
    console.log('\n2. Testing point payment for approved buyer...');
    try {
      const approvedBuyerProfile = await BuyerProfile.findOne({ userId: approvedBuyerUser._id });
      const initialPoints = approvedBuyerProfile?.point || 0;

      if (initialPoints < 600) {
        console.log('❌ Insufficient points for test. Need at least 600 points.');
        return;
      }

      const orderData = {
        buyerId: approvedBuyerUser._id,
        items: [
          {
            productId: testProduct._id,
            quantity: 1,
            selectedOptions: ['パクチー'],
            subtotal: testProduct.price + 50 // 550
          }
        ],
        paymentType: 'ポイント',
        totalAmount: 550,
        pointsUsed: 550,
        pointsEarned: 0,
        status: 'paid'
      };

      const order = new Order(orderData);
      await order.save();

      // Update product stock
      await Product.findByIdAndUpdate(testProduct._id, { $inc: { stock: -1 } });

      // Deduct points from buyer profile
      await BuyerProfile.findByIdAndUpdate(approvedBuyerProfile!._id, { $inc: { point: -orderData.pointsUsed } });

      // Create point transaction for deduction
      await PointTransaction.create({
        userId: approvedBuyerUser._id,
        orderId: order._id,
        type: 'purchase_deduction',
        amount: -orderData.pointsUsed,
        note: `Points used for order payment`
      });

      console.log('✅ Point payment order created successfully');
      console.log(`   Order ID: ${order._id}`);
      console.log(`   Total: ¥${order.totalAmount}`);
      console.log(`   Points used: ${order.pointsUsed}`);
      console.log(`   Buyer points: ${initialPoints} → ${initialPoints - orderData.pointsUsed}`);

    } catch (error) {
      console.log('❌ Point payment order creation failed:', error);
    }

    // Test 3: Verify order retrieval
    console.log('\n3. Testing order retrieval...');
    try {
      const buyerOrders = await Order.find({ buyerId: buyerUser._id })
        .populate('items.productId', 'name type price')
        .sort({ createdAt: -1 });

      const approvedBuyerOrders = await Order.find({ buyerId: approvedBuyerUser._id })
        .populate('items.productId', 'name type price')
        .sort({ createdAt: -1 });

      console.log('✅ Order retrieval successful');
      console.log(`   Pending buyer orders: ${buyerOrders.length}`);
      console.log(`   Approved buyer orders: ${approvedBuyerOrders.length}`);

      if (buyerOrders.length > 0) {
        const latestOrder = buyerOrders[0];
        console.log(`   Latest order: ${latestOrder._id} - ¥${latestOrder.totalAmount} (${latestOrder.status})`);
      }

    } catch (error) {
      console.log('❌ Order retrieval failed:', error);
    }

    // Test 4: Verify point transactions
    console.log('\n4. Testing point transaction history...');
    try {
      const buyerTransactions = await PointTransaction.find({ userId: buyerUser._id })
        .sort({ createdAt: -1 });

      const approvedBuyerTransactions = await PointTransaction.find({ userId: approvedBuyerUser._id })
        .sort({ createdAt: -1 });

      console.log('✅ Point transaction retrieval successful');
      console.log(`   Pending buyer transactions: ${buyerTransactions.length}`);
      console.log(`   Approved buyer transactions: ${approvedBuyerTransactions.length}`);

      if (buyerTransactions.length > 0) {
        const latestTransaction = buyerTransactions[0];
        console.log(`   Latest transaction: ${latestTransaction.type} - ${latestTransaction.amount} points`);
      }

    } catch (error) {
      console.log('❌ Point transaction retrieval failed:', error);
    }

    // Test 5: Verify stock deduction
    console.log('\n5. Testing stock management...');
    try {
      const updatedProduct = await Product.findById(testProduct._id);
      console.log('✅ Stock management verification successful');
      console.log(`   Product stock: ${testProduct.stock} → ${updatedProduct?.stock}`);
      console.log(`   Stock deducted: ${testProduct.stock - (updatedProduct?.stock || 0)} units`);

    } catch (error) {
      console.log('❌ Stock management verification failed:', error);
    }

    console.log('\n🎉 Order API functionality tests completed!');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  testOrderAPI();
}

export default testOrderAPI;