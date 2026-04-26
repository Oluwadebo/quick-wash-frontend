import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/lib/models/Transaction';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const { amount, method, reference } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    const user = await User.findOne({ uid: decoded.uid });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Update balance
    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();

    // Record Transaction
    const newTrans = await Transaction.create({
      userId: decoded.uid,
      type: 'deposit',
      amount: amount,
      desc: `Wallet Funding via ${method || 'External'}`,
      method: method,
      reference: reference,
      status: 'completed'
    });

    return NextResponse.json({
      message: 'Wallet funded successfully',
      balance: user.walletBalance,
      transaction: newTrans
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
