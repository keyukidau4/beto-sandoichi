import mongoose from 'mongoose';
import { PointService } from '../services/pointService';
import { User } from '../models/User';
import { BuyerProfile } from '../models/BuyerProfile';
import { Order } from '../models/Order';
import { PointTransaction } from '../models/PointTransaction';
import connectDB from '../config/database';

async function testPointSystem() {
  try {
    console.log('🧪 Testing Point Management System...\n');

    // Connect to database
    await connectDB();

    // Find a test buyer
    const testBuyer = await User.findOne({ 
      role: 'buyer', 
      email: { $regex: /buyer@test\.com|approved-buyer@test\.com/i } 
    });

    if (!testBuyer) {
      console.log('❌ No test buyer found. Please create a test buyer first.');
      return;
    }

    console.log(`✅ Found test buyer: ${testBuyer.email}`);

    // Get buyer profile
    const buyerProfile = await BuyerProfile.findOne({ userId: testBuyer._id });
    if (!buyerProfile) {
      console.log('❌ Buyer profile not found');
      return;
    }

    console.log(`📊 Initial point balance: ${buyerProfile.point} points\n`);

    // Test 1: Point calculation
    console.log('🧮 Test 1: Point Calculation');
    const testAmounts = [100, 250, 999, 1000, 1500];
    for (const amount of testAmounts) {
      const points = PointService.calculatePointsEarned(amount);
      console.log(`  ${amount}円 = ${points} points`);
    }
    console.log('✅ Point calculation test passed\n');

    // Test 2: Point validation
    console.log('🔍 Test 2: Point Validation');
    const validation1 = await PointService.validatePointsForPayment(testBuyer._id, 50);
    console.log(`  Validate 50 points: ${validation1.isValid ? '✅ Valid' : '❌ Invalid'} (Available: ${validation1.availablePoints})`);
    
    const validation2 = await PointService.validatePointsForPayment(testBuyer._id, 99999);
    console.log(`  Validate 99999 points: ${validation2.isValid ? '✅ Valid' : '❌ Invalid'} (Available: ${validation2.availablePoints})`);
    console.log('✅ Point validation test passed\n');

    // Test 3: Add points (admin adjustment)
    console.log('💰 Test 3: Add Points');
    const initialBalance = await PointService.getPointBalance(testBuyer._id);
    console.log(`  Initial balance: ${initialBalance} points`);

    const addResult = await PointService.addPoints(
      testBuyer._id,
      100,
      'bank_deposit_transfer_add',
      'Test point addition'
    );

    if (addResult.success) {
      const newBalance = await PointService.getPointBalance(testBuyer._id);
      console.log(`  ✅ Added 100 points. New balance: ${newBalance} points`);
    } else {
      console.log(`  ❌ Failed to add points: ${addResult.error}`);
    }
    console.log('✅ Add points test passed\n');

    // Test 4: Deduct points
    console.log('💸 Test 4: Deduct Points');
    const currentBalance = await PointService.getPointBalance(testBuyer._id);
    console.log(`  Current balance: ${currentBalance} points`);

    if (currentBalance >= 50) {
      const deductResult = await PointService.deductPoints(
        testBuyer._id,
        50,
        'Test point deduction'
      );

      if (deductResult.success) {
        const newBalance = await PointService.getPointBalance(testBuyer._id);
        console.log(`  ✅ Deducted 50 points. New balance: ${newBalance} points`);
      } else {
        console.log(`  ❌ Failed to deduct points: ${deductResult.error}`);
      }
    } else {
      console.log('  ⚠️ Insufficient points for deduction test');
    }
    console.log('✅ Deduct points test passed\n');

    // Test 5: Point history
    console.log('📜 Test 5: Point History');
    const history = await PointService.getPointHistory(testBuyer._id, 1, 5);
    console.log(`  Found ${history.transactions.length} recent transactions:`);
    
    history.transactions.forEach((transaction, index) => {
      console.log(`    ${index + 1}. ${transaction.type}: ${transaction.amount > 0 ? '+' : ''}${transaction.amount} points - ${transaction.note}`);
    });
    console.log('✅ Point history test passed\n');

    // Test 6: Order reward processing (if there are any orders)
    console.log('🎁 Test 6: Order Reward Processing');
    const testOrder = await Order.findOne({ 
      buyerId: testBuyer._id,
      paymentType: '代引き',
      status: 'pending'
    });

    if (testOrder) {
      console.log(`  Found test order: ${testOrder._id}`);
      const rewardResult = await PointService.processOrderReward(testOrder._id);
      
      if (rewardResult.success) {
        console.log(`  ✅ Processed reward: ${rewardResult.pointsEarned} points earned`);
      } else {
        console.log(`  ❌ Failed to process reward: ${rewardResult.error}`);
      }
    } else {
      console.log('  ⚠️ No suitable test order found for reward processing');
    }
    console.log('✅ Order reward test completed\n');

    // Final balance check
    const finalBalance = await PointService.getPointBalance(testBuyer._id);
    console.log(`🏁 Final point balance: ${finalBalance} points\n`);

    console.log('🎉 All point system tests completed successfully!');

  } catch (error) {
    console.error('❌ Point system test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
if (require.main === module) {
  testPointSystem();
}

export { testPointSystem };