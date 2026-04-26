import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super-sub-admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { phoneNumber, email, password, ...rest } = data;

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ 
      $or: [{ phoneNumber }, { email }] 
    });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this phone or email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const friendlyUid = Math.random().toString(36).substring(2, 10);

    const newUser = await User.create({
      ...rest,
      phoneNumber,
      email,
      password: hashedPassword,
      uid: friendlyUid,
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
