import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminInvite from '@/lib/models/AdminInvite';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token, phoneNumber, email, password } = await req.json();

    const invite = await AdminInvite.findOne({ token, isUsed: false });
    if (!invite || invite.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    // Check if user exists
    const existing = await User.findOne({ 
      $or: [{ phoneNumber }, { email }] 
    });
    if (existing) {
      return NextResponse.json({ message: 'Phone or Email already in use' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = uuidv4();

    await User.create({
      uid,
      fullName: invite.fullName,
      phoneNumber,
      email,
      password: hashedPassword,
      role: invite.role, // admin or super-sub-admin
      isApproved: false,
      trustPoints: 100,
      trustScore: 100,
      status: 'active'
    });

    invite.isUsed = true;
    await invite.save();

    return NextResponse.json({ message: 'Admin setup complete' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
