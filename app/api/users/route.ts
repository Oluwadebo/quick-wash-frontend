import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({});
    
    const userData = users.map(u => {
      const obj = u.toObject();
      delete obj.password;
      return obj;
    });

    return NextResponse.json(userData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
