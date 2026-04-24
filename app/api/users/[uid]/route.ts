import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    await connectDB();
    const { uid } = params;
    const user = await User.findOne({ uid });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = user.toObject();
    delete userData.password;

    return NextResponse.json(userData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
