import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import User from '@/backend/models/User';
import Transaction from '@/backend/models/Transaction';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const { amount, method } = await req.json();
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    const user = await User.findOne({ uid: decoded.uid });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();

    const transaction = await Transaction.create({
      userId: user.uid,
      amount,
      type: 'deposit',
      desc: 'Wallet Funding',
      method,
      status: 'completed'
    });

    return NextResponse.json({
      balance: user.walletBalance,
      transaction
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
