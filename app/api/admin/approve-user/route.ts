import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import User from '@/backend/models/User';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId, approve } = await req.json();
    const user = await User.findOne({ uid: userId });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    user.isApproved = approve;
    await user.save();

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
