import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { identifier, password } = await req.json(); // identifier can be email or phone

    // Helper to initialize Super Admin
    const SUPER_ADMIN_EMAIL = 'ogunweoluwadebo1@gmail.com';
    const SUPER_ADMIN_PHONE = '07048865686';
    
    const superAdmin = await User.findOne({ 
      $or: [{ email: SUPER_ADMIN_EMAIL }, { phoneNumber: SUPER_ADMIN_PHONE }] 
    });

    if (!superAdmin) {
      console.log('Initializing Super Admin...');
      const hashedPassword = await bcrypt.hash('Oluwadebo06().', 10);
      const { v4: uuidv4 } = require('uuid');
      await User.create({
        uid: uuidv4(),
        fullName: 'ogunwe debo',
        email: SUPER_ADMIN_EMAIL,
        phoneNumber: SUPER_ADMIN_PHONE,
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        trustPoints: 100,
        trustScore: 100,
        status: 'active'
      });
      console.log('Super Admin initialized.');
    }

    // Find user by phone OR email
    const user = await User.findOne({ 
      $or: [{ phoneNumber: identifier }, { email: identifier }] 
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found. Please register or check your details.' }, { status: 401 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Incorrect password. Please try again or reset it.' }, { status: 401 });
    }

    const userData = user.toObject();
    delete userData.password;

    const token = signToken({ uid: user.uid, role: user.role, email: user.email });

    return NextResponse.json({ user: userData, token }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
