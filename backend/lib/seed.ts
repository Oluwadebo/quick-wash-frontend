import User from "../models/User";
import bcrypt from "bcryptjs";

export const seedAdmin = async () => {
  try {
    const adminEmail = "ogunwedebo21@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        fullName: "Quick-Wash Admin",
        email: adminEmail,
        phoneNumber: "09012345678",
        password: hashedPassword,
        role: "admin",
        isApproved: true,
        status: "active",
        trustPoints: 100,
        trustScore: 100,
        walletBalance: 0,
        pendingBalance: 0
      });
      console.log("✅ Initial Admin seeded");
    }
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
};
