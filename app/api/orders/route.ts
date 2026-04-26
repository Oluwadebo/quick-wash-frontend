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
    
    // Check wallet balance ONLY if payment method is wallet
    const user = await User.findOne({ uid: decoded.uid });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    const isWalletPayment = data.paymentMethod === 'wallet';
    
    if (isWalletPayment && (user.walletBalance < data.totalPrice)) {
      return NextResponse.json({ message: 'Insufficient wallet balance' }, { status: 400 });
    }

    if (isWalletPayment) {
      // Deduct balance
      user.walletBalance = (Number(user.walletBalance) || 0) - (Number(data.totalPrice) || 0);
      await user.save();

      // Record Transaction - will update below with friendlyId
    }

    // Create friendly ID
    // Using a more robust count-based ID
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

    // Record Transaction for wallet payment using the generated ID
    if (isWalletPayment) {
      await Transaction.create({
        userId: decoded.uid,
        type: 'withdrawal',
        amount: data.totalPrice,
        desc: `Order #${friendlyId} Payment`,
        status: 'completed'
      });
    }

    // Fetch vendor and customer details for complete address
    const vendor = await User.findOne({ uid: data.vendorId });
    const customer = await User.findOne({ uid: decoded.uid });

    const newOrder = await Order.create({
      ...data,
      id: friendlyId,
      customerUid: decoded.uid,
      customerName: customer?.fullName || data.customerName,
      customerPhone: customer?.phoneNumber || data.customerPhone,
      customerAddress: customer?.address || data.customerAddress,
      customerLandmark: customer?.landmark || data.customerLandmark,
      vendorAddress: vendor?.shopAddress || vendor?.address || data.vendorAddress,
      vendorLandmark: vendor?.landmark || data.vendorLandmark,
      ...codes
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    // Security: Validate auth token and verify if the requester can see these orders
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    let query: any = {};
    
    // If no specific userId requested, default to self based on role
    const targetUserId = userId || decoded.uid;
    const targetRole = role || decoded.role;

    // Strict security check: Users can only see their own orders unless admin
    if (decoded.role !== 'admin' && decoded.role !== 'super-sub-admin') {
      if (targetUserId !== decoded.uid) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }
    }

    if (targetRole === 'customer') query = { customerUid: targetUserId };
    else if (targetRole === 'vendor') query = { vendorId: targetUserId };
    else if (targetRole === 'rider') query = { riderUid: targetUserId };
    else if (decoded.role === 'admin' || decoded.role === 'super-sub-admin') {
       // Admins can see all or filter by user
       if (userId) {
          query = { $or: [{ customerUid: userId }, { vendorId: userId }, { riderUid: userId }] };
       }
    } else {
        return NextResponse.json({ message: 'Missing role context' }, { status: 400 });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
