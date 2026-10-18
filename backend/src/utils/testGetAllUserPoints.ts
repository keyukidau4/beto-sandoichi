import mongoose from "mongoose";
import connectDB from "../config/database";
// Import all models to ensure they're registered
import { User } from "../models/User";
import { BuyerProfile } from "../models/BuyerProfile";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { PointTransaction } from "../models/PointTransaction";
import { ContactRequest } from "../models/ContactRequest";
import { EmailTemplate } from "../models/EmailTemplate";
import { ProductView } from "../models/ProductView";

async function testGetAllUserPoints() {
  try {
    console.log("🧪 Testing Get All User Points...\n");

    // Connect to database
    await connectDB();

    // Test the query that's failing
    console.log("📊 Testing BuyerProfile query...");

    // First, let's see what buyer profiles exist
    const allProfiles = await BuyerProfile.find();
    console.log(`Found ${allProfiles.length} buyer profiles`);

    // Check if they have valid userId references
    for (const profile of allProfiles) {
      console.log(
        `Profile ${profile._id}: userId = ${profile.userId}, points = ${profile.point}`
      );

      // Check if the user exists
      const user = await User.findById(profile.userId);
      if (user) {
        console.log(`  ✅ User found: ${user.email} (${user.role})`);
      } else {
        console.log(`  ❌ User not found for userId: ${profile.userId}`);
      }
    }

    console.log("\n📊 Testing populated query...");

    // Test the populated query
    const profiles = await BuyerProfile.find()
      .populate("userId", "email status role")
      .sort({ point: -1 })
      .limit(5);

    console.log(`Populated query returned ${profiles.length} profiles:`);
    profiles.forEach((profile, index) => {
      console.log(
        `  ${index + 1}. Points: ${profile.point}, User: ${
          profile.userId ? (profile.userId as any).email : "No user"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
if (require.main === module) {
  testGetAllUserPoints();
}

export { testGetAllUserPoints };
