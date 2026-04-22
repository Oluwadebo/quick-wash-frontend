import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Transaction from '@/backend/models/Transaction';
import { verifyToken } from '@/lib/auth-utils';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const data = await req.json();
    const order = await Order.findOne({ id: id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // Status updates MUST be handled via /api/orders/[id]/status
    if (data.status && data.status !== order.status) {
      return NextResponse.json({ message: 'Use status endpoint for state changes' }, { status: 400 });
    }

    // Standard update for other fields
    Object.assign(order, data);
    await order.save();

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
