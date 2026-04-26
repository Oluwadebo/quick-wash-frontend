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

    const { userId, type, amount, desc, method, reference, status } = await req.json();

    // Only admins or the user themselves can record a transaction
    if (userId !== decoded.uid && decoded.role !== 'admin') {
       return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const user = await User.findOne({ uid: userId });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Update balance based on type
    if (type === 'deposit' || type === 'refund' || type === 'payout' || type === 'commission') {
      user.walletBalance = (user.walletBalance || 0) + amount;
    } else if (type === 'withdrawal' || type === 'payment') {
      user.walletBalance = (user.walletBalance || 0) - amount;
    }

    await user.save();

    // Record Transaction
    const newTrans = await Transaction.create({
      userId,
      type,
      amount,
      desc,
      method,
      reference,
      status: status || 'completed',
      date: new Date()
    });

    return NextResponse.json({
      message: 'Transaction recorded successfully',
      balance: user.walletBalance,
      transaction: newTrans
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    let query: any = {};
    if (userId) {
      query.userId = userId;
    }

    // Security: users see only their transactions, admins see all if no userId filter
    if (decoded.role !== 'admin' && decoded.role !== 'super-sub-admin') {
      if (!userId || userId !== decoded.uid) {
        query.userId = decoded.uid;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
