import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Transaction from '@/backend/models/Transaction';
import { verifyToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { orderId, resolution, customAmount } = await req.json();
    const order = await Order.findOne({ id: orderId });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    if (resolution === 'refund' || resolution === 'partial') {
      const amountToRefund = resolution === 'refund' ? order.totalPrice : (customAmount || 0);
      
      order.status = resolution === 'refund' ? 'Refunded (Full)' : `Refunded (Partial: ₦${amountToRefund})`;
      order.disputed = false;
      order.refundAmount = amountToRefund;
      order.disputedAt = new Date();
      
      // Credit customer wallet
      const customer = await User.findOne({ uid: order.customerUid });
      if (customer) {
        customer.walletBalance = (customer.walletBalance || 0) + amountToRefund;
        await customer.save();
        
        await Transaction.create({
          userId: customer.uid,
          amount: amountToRefund,
          type: 'deposit',
          desc: `Dispute Refund (${resolution}) - Order #${orderId}`,
          status: 'completed'
        });
      }

      // If partial, release the rest to the vendor if applicable
      if (resolution === 'partial') {
        const remainingForVendor = Math.max(0, (order.itemsPrice || 0) - amountToRefund);
        if (remainingForVendor > 0) {
          const vendor = await User.findOne({ uid: order.vendorId });
          if (vendor) {
            vendor.walletBalance = (vendor.walletBalance || 0) + remainingForVendor;
            if (!order.payoutReleased20) {
                order.payoutReleased20 = true; // Mark as paid out fully now
            }
            await vendor.save();
            
            await Transaction.create({
              userId: vendor.uid,
              amount: remainingForVendor,
              type: 'deposit',
              desc: `Partial Funds Release (Dispute Partial Refund) - Order #${order.id}`,
              status: 'completed'
            });
          }
        }
      }
    } else if (resolution === 'reject') {
      order.status = 'completed';
      order.disputed = false;
      
      // Vendor gets the held 20%
      if (!order.payoutReleased20) {
        const itemsPrice = order.itemsPrice || 0;
        const remaining20 = itemsPrice * 0.2;
        const vendor = await User.findOne({ uid: order.vendorId });
        if (vendor) {
          vendor.walletBalance = (vendor.walletBalance || 0) + remaining20;
          await vendor.save();
          
          await Transaction.create({
            userId: vendor.uid,
            amount: remaining20,
            type: 'deposit',
            desc: `Released Held Funds (Dispute Rejected) - Order #${order.id}`,
            status: 'completed'
          });
          order.payoutReleased20 = true;
        }
      }
    }

    await order.save();
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
