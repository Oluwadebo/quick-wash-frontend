import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import Order from '@/backend/models/Order';
import User from '@/backend/models/User';
import Transaction from '@/backend/models/Transaction';
import { verifyToken, checkRole } from '@/lib/auth-utils';

const STATUS_SEQUENCE = [
  'pending',
  'rider_assign_pickup',
  'washing',
  'ready_for_delivery',
  'rider_assign_delivery',
  'picked_up',
  'delivered',
  'completed'
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const data = await req.json();
    const { status: newStatus, handoverCode } = data;

    const order = await Order.findOne({ id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    const currentStatus = order.status.toLowerCase();
    const targetStatus = newStatus ? newStatus.toLowerCase() : currentStatus;

    // Super Admin Bypass
    const isSuperAdmin = decoded.email === 'ogunwedebo21@gmail.com';

    // special Action handling (Push Out / Dispute)
    if (data.action === 'push_out' && decoded.role === 'rider') {
      const rider = await User.findOne({ uid: decoded.uid });
      if (rider) {
        const penalty = 500;
        rider.walletBalance = (rider.walletBalance || 0) - penalty;
        await rider.save();
        await Transaction.create({
          userId: rider.uid,
          amount: penalty,
          type: 'withdrawal',
          desc: `Penalty: Order Push Out (#${order.id})`,
          status: 'completed'
        });
        order.riderUid = undefined;
        order.riderName = undefined;
        order.status = 'rider_assign_pickup';
        await order.save();
        return NextResponse.json(order);
      }
    }

    if (data.action === 'resolve_dispute' && decoded.role === 'admin') {
      const { resolution, customAmount } = data;
      if (resolution === 'refund' || resolution === 'partial') {
        const amountToRefund = resolution === 'refund' ? order.totalPrice : (customAmount || 0);
        order.status = resolution === 'refund' ? 'Refunded (Full)' : `Refunded (Partial: ₦${amountToRefund})`;
        order.disputed = false;
        order.refundAmount = amountToRefund;
        const customer = await User.findOne({ uid: order.customerUid });
        if (customer) {
          customer.walletBalance = (customer.walletBalance || 0) + amountToRefund;
          await customer.save();
          await Transaction.create({
            userId: customer.uid,
            amount: amountToRefund,
            type: 'deposit',
            desc: `Dispute Refund (${resolution}) - Order #${order.id}`,
            status: 'completed'
          });
        }
      } else if (resolution === 'reject') {
        order.status = 'completed';
        order.disputed = false;
        // Release 20% to vendor if not already done
        if (!order.payoutReleased20) {
          const vendor = await User.findOne({ uid: order.vendorId });
          if (vendor) {
            const payoutAmount = order.itemsPrice * 0.2;
            vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
            await vendor.save();
            await Transaction.create({
              userId: vendor.uid,
              amount: payoutAmount,
              type: 'deposit',
              desc: `Final Payout (Dispute Rejected) - Order #${order.id}`,
              status: 'completed'
            });
            order.payoutReleased20 = true;
          }
        }
      }
      await order.save();
      return NextResponse.json(order);
    }

    if (!isSuperAdmin && newStatus) {
      // Validate sequence
      const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
      const targetIndex = STATUS_SEQUENCE.indexOf(targetStatus);

      if (targetIndex === -1 && !['refunded (full)', 'refunded (partial)'].includes(targetStatus)) {
        return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
      }

      // If it's a standard transition in the sequence
      if (targetIndex !== -1) {
        if (targetIndex !== currentIndex + 1) {
          return NextResponse.json({ 
            message: `Forbidden transition: ${currentStatus} -> ${targetStatus}. Must follow sequence: ${STATUS_SEQUENCE.join(' > ')}` 
          }, { status: 400 });
        }

        // Handover Code Validations
        if (targetStatus === 'picked_up' && handoverCode !== order.code2) {
          return NextResponse.json({ message: 'Invalid pickup code (Code 2)' }, { status: 400 });
        }
        if (targetStatus === 'delivered' && handoverCode !== order.code4) {
          return NextResponse.json({ message: 'Invalid delivery code (Code 4)' }, { status: 400 });
        }
      }
    }

    // Role Checks
    // Simplified for now, but usually:
    // vendor can move to washing, ready_for_delivery
    // rider can move to picked_up, delivered
    // admin can move to anything

    // 80% Payout Logic: Release when status moves to 'washing'
    if (targetStatus === 'washing' && !order.payoutReleased80) {
      const vendor = await User.findOne({ uid: order.vendorId });
      if (vendor) {
        const payoutAmount = order.itemsPrice * 0.8;
        vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
        await vendor.save();
        
        await Transaction.create({
          userId: vendor.uid,
          amount: payoutAmount,
          type: 'deposit',
          desc: `Order Payout (80%) - Order #${order.id}`,
          status: 'completed'
        });
        
        order.payoutReleased80 = true;
        order.washingAt = new Date();
      }
    }

    // 20% Payout Logic: Release when status moves to 'completed'
    if (targetStatus === 'completed' && !order.payoutReleased20) {
      const vendor = await User.findOne({ uid: order.vendorId });
      if (vendor) {
        const payoutAmount = order.itemsPrice * 0.2;
        vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
        await vendor.save();
        
        await Transaction.create({
          userId: vendor.uid,
          amount: payoutAmount,
          type: 'deposit',
          desc: `Final Payout (20%) - Order #${order.id}`,
          status: 'completed'
        });
        
        order.payoutReleased20 = true;
        order.completedAt = new Date();
      }
    }

    order.status = targetStatus;
    if (data.color) order.color = data.color;
    
    // Update timestamps
    if (targetStatus === 'ready_for_delivery') order.readyAt = new Date();
    if (targetStatus === 'picked_up') order.pickedUpAt = new Date();
    if (targetStatus === 'delivered') order.deliveredAt = new Date();

    await order.save();
    return NextResponse.json(order);

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
