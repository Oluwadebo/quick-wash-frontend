import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth-utils';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phoneNumber, password } = await req.json();

    // Find user by phone
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      // Specific error message: "Phone number not registered"
      return NextResponse.json({ message: 'This phone number is not registered on Quick-Wash' }, { status: 401 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Specific error message: "Incorrect password"
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
