import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { identifier } = await req.json(); // email or phone

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier }
      ]
    });

    if (!user) {
      // For security, don't reveal if user exists, but here we want to be helpful
      return NextResponse.json({ message: 'If an account exists with this identifier, a reset code has been generated.' }, { status: 200 });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, you'd email/SMS this code. 
    // Since we don't have a mailer service configured, we'll log it for development.
    console.log(`PASSWORD RESET CODE FOR ${user.email}: ${resetCode}`);

    user.resetPasswordToken = resetCode; // In production, hash this!
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // For this environment, we return the code in response if not production
    // or just assume the user sees logs. But for ease of use in UI development:
    return NextResponse.json({ 
      message: 'Reset code generated successfully.',
      demoCode: process.env.NODE_ENV !== 'production' ? resetCode : undefined 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
