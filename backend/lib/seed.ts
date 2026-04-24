import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const seedAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'ogunwedebo21@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPhone = process.env.ADMIN_PHONE || '08000000000';

    console.log('🔍 Checking for Super Admin...');

    // Check if the specific admin account already exists
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    
    if (existingAdmin) {
      console.log(`ℹ️  Admin account exists: ${existingAdmin.email}`);
      // Update password to match .env if it exists (ensures user doesn't get locked out during dev)
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Admin password synchronized with .env');
      return;
    }

    // Check if any other admin exists (preventing multiple admins if not intended yet)
    const anyAdminExists = await User.findOne({ role: 'admin' });
    if (anyAdminExists) {
      console.log(`ℹ️  Another admin account exists: ${anyAdminExists.email}`);
      return;
    }

    // Check if the specific admin email or phone is already taken (maybe as a customer)
    const conflictUser = await User.findOne({ $or: [{ email: adminEmail }, { phoneNumber: adminPhone }] });
    if (conflictUser) {
        console.log(`⚠️  Conflict detected: Email ${adminEmail} or Phone ${adminPhone} is already registered to a non-admin account.`);
        console.log('   Please use a different email/phone in your .env or manually update the user role in MongoDB.');
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const uid = 'super-admin-root';

    const newAdmin = new User({
      uid,
      fullName: 'Super Admin',
      phoneNumber: adminPhone,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      status: 'active',
      walletBalance: 0,
      pendingBalance: 0,
      trustPoints: 100,
      trustScore: 100,
      transferReference: 'ADM-REF-001'
    });

    await newAdmin.save();
    console.log('✅ Super Admin created successfully');
    console.log(`📧 Admin Email: ${adminEmail}`);
    console.log(`🔑 Default Password: ${adminPassword} (Please change after login)`);
  } catch (error: any) {
    console.error('❌ Error seeding admin:', error.message);
  }
};
