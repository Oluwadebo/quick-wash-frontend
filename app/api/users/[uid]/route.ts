import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    await connectDB();
    const { uid } = await params;
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    await connectDB();
    const { uid } = await params;
    const data = await req.json();
    
    const user = await User.findOneAndUpdate({ uid }, data, { new: true });
    
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  try {
    await connectDB();
    const { uid } = await params;
    
    const user = await User.findOneAndDelete({ uid });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
