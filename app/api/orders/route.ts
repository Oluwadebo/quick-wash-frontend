import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Transaction from '@/lib/models/Transaction';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const data = await req.json();
    
    // Create friendly ID
    const count = await Order.countDocuments();
    const friendlyId = (1000 + count + 1).toString();

    // Generate 4-digit handover codes
    const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();
    const codes = {
      code1: generateCode(),
      code2: generateCode(),
      code3: generateCode(),
      code4: generateCode(),
    };

    const newOrder = await Order.create({
      ...data,
      id: friendlyId,
      customerUid: decoded.uid,
      ...codes
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    let query = {};
    if (userId) {
      if (role === 'customer') query = { customerUid: userId };
      else if (role === 'vendor') query = { vendorId: userId };
      else if (role === 'rider') query = { riderUid: userId };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
