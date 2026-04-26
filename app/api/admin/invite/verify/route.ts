import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminInvite from '@/lib/models/AdminInvite';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ message: 'Missing token' }, { status: 400 });

    const invite = await AdminInvite.findOne({ token, isUsed: false });
    if (!invite || invite.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({ fullName: invite.fullName, role: invite.role });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
