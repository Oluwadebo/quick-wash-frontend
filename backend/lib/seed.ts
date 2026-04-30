import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const seedAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "ogunwedebo21@gmail.com").trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || "ogunwedebo21").trim();

    // Check if the admin already exists
    let existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("✅ Admin already exists. Updating credentials to ensure sync...");
      existingAdmin.password = await bcrypt.hash(adminPassword, 10);
      existingAdmin.role = 'super-admin';
      existingAdmin.isApproved = true;
      existingAdmin.status = 'active';
      existingAdmin.uid = existingAdmin.uid || "admin-root-001";
      await existingAdmin.save();
      return;
    }

    console.log(`[Seed] Creating Super Admin: ${adminEmail}`);

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      uid: "admin-root-001",
      fullName: "Quick-Wash Admin",
      email: adminEmail,
      phoneNumber: "09012345678",
      password: hashedPassword,
      role: "super-admin",
      isApproved: true,
      status: "active",
      trustPoints: 100,
      trustScore: 100,
      walletBalance: 0,
      pendingBalance: 0
    });
    console.log("✅ Super Admin successfully seeded.");
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
};
