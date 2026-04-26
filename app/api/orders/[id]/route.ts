import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Transaction from '@/lib/models/Transaction';
import { verifyToken } from '@/lib/auth-utils';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const data = await req.json();
    const order = await Order.findOne({ id });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    const oldStatus = order.status;
    const newStatus = data.status;

    // 80% Payout Logic: Release when status moves to 'washing'
    if (newStatus === 'washing' && !order.payoutReleased80) {
      const vendor = await User.findOne({ uid: order.vendorId });
      if (vendor) {
        const payoutAmount = Math.floor((order.itemsPrice || 0) * 0.8);
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

    // Rider Fee: 50% Release when status moves to 'picked_up'
    if (newStatus === 'picked_up' && oldStatus !== 'picked_up') {
      const rider = await User.findOne({ uid: order.riderUid || data.riderUid });
      if (rider) {
        const riderFee = order.riderFee || 1000;
        const payoutAmount = Math.floor(riderFee * 0.5);
        rider.walletBalance = (rider.walletBalance || 0) + payoutAmount;
        await rider.save();

        await Transaction.create({
          userId: rider.uid,
          amount: payoutAmount,
          type: 'deposit',
          desc: `Rider Fee (50%) - Order #${order.id}`,
          status: 'completed'
        });
        order.pickedUpAt = new Date();
      }
    }

    // 20% Payout Logic: Release when status moves to 'completed'
    if (newStatus === 'completed' && !order.payoutReleased20) {
      const vendor = await User.findOne({ uid: order.vendorId });
      if (vendor) {
        const payoutAmount = (order.itemsPrice || 0) - Math.floor((order.itemsPrice || 0) * 0.8); // Remaining 20%
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

      // Remaining 50% Rider Fee on completion
      const rider = await User.findOne({ uid: order.riderUid || data.riderUid });
      if (rider) {
        const riderFee = order.riderFee || 1000;
        const payoutAmount = riderFee - Math.floor(riderFee * 0.5); // Remaining 50%
        rider.walletBalance = (rider.walletBalance || 0) + payoutAmount;
        await rider.save();

        await Transaction.create({
          userId: rider.uid,
          amount: payoutAmount,
          type: 'deposit',
          desc: `Final Rider Fee (50%) - Order #${order.id}`,
          status: 'completed'
        });
      }
    }

    // Handover Code Validation (if provided)
    if (data.handoverCode) {
      if (newStatus === 'picked_up' && data.handoverCode !== order.code2) {
        return NextResponse.json({ message: 'Invalid handover code' }, { status: 400 });
      }
      if (newStatus === 'delivered' && data.handoverCode !== order.code4) {
        return NextResponse.json({ message: 'Invalid delivery code' }, { status: 400 });
      }
    }

    // Rider Penalty / Push Out logic
    if (data.action === 'push_out' && decoded.role === 'rider') {
      const rider = await User.findOne({ uid: decoded.uid });
      if (rider) {
        const penalty = 500; // Fixed penalty for pushing out
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
        order.status = 'rider_assign_pickup'; // Back to queue
      }
    }

    // Dispute Resolution (Admin only)
    if (data.action === 'resolve_dispute' && decoded.role === 'admin') {
      const { resolution, customAmount } = data;
      const isSuper = decoded.email === 'ogunweoluwadebo1@gmail.com' || decoded.phoneNumber === '07048865686';
      
      if (resolution === 'refund' || resolution === 'partial') {
        const amountToRefund = resolution === 'refund' ? order.totalPrice : (customAmount || 0);
        
        order.status = resolution === 'refund' ? 'Refunded (Full)' : `Refunded (Partial: ₦${amountToRefund})`;
        order.disputed = false;
        order.refundAmount = amountToRefund;
        
        // Credit customer wallet
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

        // If partial, release the rest to the vendor if applicable
        if (resolution === 'partial') {
          const remainingForVendor = Math.max(0, (order.itemsPrice || 0) - amountToRefund);
          if (remainingForVendor > 0) {
            const vendor = await User.findOne({ uid: order.vendorId });
            if (vendor) {
              vendor.walletBalance = (vendor.walletBalance || 0) + remainingForVendor;
              await vendor.save();
              
              await Transaction.create({
                userId: vendor.uid,
                amount: remainingForVendor,
                type: 'deposit',
                desc: `Partial Funds Release (Dispute) - Order #${order.id}`,
                status: 'completed'
              });
              order.payoutReleased20 = true;
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
    }

    // Rider Penalty / Return logic
    if (newStatus === 'rider_assign_pickup' && oldStatus !== 'rider_assign_pickup' && decoded.role === 'rider') {
      const rider = await User.findOne({ uid: decoded.uid });
      if (rider) {
        const penalty = 200; // Penalty for returning order
        rider.walletBalance = (rider.walletBalance || 0) - penalty;
        await rider.save();
        
        await Transaction.create({
          userId: rider.uid,
          amount: penalty,
          type: 'withdrawal',
          desc: `Penalty: Order Return (#${order.id})`,
          status: 'completed'
        });
        
        order.riderUid = undefined;
        order.riderName = undefined;
        order.riderPhone = undefined;
      }
    }

    // Standard update
    Object.assign(order, data);
    await order.save();

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
