import mongoose from "mongoose";
import { User } from "../models/User";
import connectDB from "../config/database";

async function createStaffUser() {
  try {
    await connectDB();

    // Check if staff user already exists
    const existingStaff = await User.findOne({ email: "staff@test.com" });

    if (existingStaff) {
      console.log("✅ Staff user already exists:", existingStaff.email);
      return;
    }

    // Create staff user
    const staffUser = new User({
      email: "staff@test.com",
      password: "password123",
      role: "staff",
      status: "approved",
    });

    await staffUser.save();
    console.log("✅ Staff user created successfully:", staffUser.email);
  } catch (error) {
    console.error("❌ Error creating staff user:", error);
  } finally {
    await mongoose.connection.close();
  }
}

createStaffUser();
