import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Order from '../models/Order';
import User from '../models/User';
import Transaction from '../models/Transaction';

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, color, handoverCode } = req.body;

    const order = await Order.findOne({ id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status === 'picked_up') {
      if (handoverCode !== order.code1) {
        return res.status(400).json({ error: 'Invalid pickup code from customer (Code 1)' });
      }
      order.pickedUpAt = new Date();
      
      // Rider gets first 50% fee
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const firstHalf = (order.riderFee || 0) * 0.5;
          rider.walletBalance = (Number(rider.walletBalance) || 0) + firstHalf;
          await rider.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: rider.uid,
            type: 'deposit',
            amount: firstHalf,
            desc: `Rider Fee (1st Half) - Order #${order.id}`,
            status: 'completed',
            date: new Date()
          });
        }
      }
      // Generate Code 2 for Vendor
      order.code2 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'picked_up_delivery') {
      // Gating: Rider cannot pick up delivery until customer says they are ready
      if (!order.customerReadyForDelivery) {
        return res.status(403).json({ error: 'Customer is not yet ready to receive this order. Please wait.' });
      }
      if (handoverCode !== order.code3) {
        return res.status(400).json({ error: 'Invalid delivery handover code from vendor (Code 3)' });
      }
      order.pickedUpDeliveryAt = new Date();
      // Generate Code 4 for Customer
      order.code4 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'delivered') {
      if (handoverCode !== order.code4) {
        return res.status(400).json({ error: 'Invalid delivery code for customer (Code 4)' });
      }
      order.deliveredAt = new Date();

      // Rider gets second 50% fee
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const secondHalf = (order.riderFee || 0) * 0.5;
          rider.walletBalance = (Number(rider.walletBalance) || 0) + secondHalf;
          await rider.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: rider.uid,
            type: 'deposit',
            amount: secondHalf,
            desc: `Rider Fee (2nd Half) - Order #${order.id}`,
            status: 'completed',
            date: new Date()
          });
        }
      }
    }

    if (status === 'washing' && !order.payoutReleased80) {
      if (handoverCode !== order.code2) {
        return res.status(400).json({ error: 'Invalid handover code from rider (Code 2)' });
      }
      order.washingAt = new Date();
      if (order.vendorId) {
        const vendor = await User.findOne({ uid: order.vendorId });
        if (vendor) {
          // 10% platform fee deduction
          const platformFeeFactor = 0.9;
          const netVendorAmount = (order.itemsPrice || 0) * platformFeeFactor;
          const payoutAmount = netVendorAmount * 0.8;
          
          console.log(`[Payout] Releasing 80% payout for Order #${order.id} to Vendor ${vendor.uid}. Amount: ${payoutAmount}`);
          vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
          await vendor.save();
          console.log(`[Payout] Vendor ${vendor.uid} wallet updated. New balance: ${vendor.walletBalance}`);
          
          await Transaction.create({
            id: uuidv4(),
            userId: vendor.uid,
            type: 'deposit',
            amount: payoutAmount,
            desc: `Order #${order.id} - 80% Payout (Washing Started) - Net after 10% fee`,
            status: 'completed',
            date: new Date()
          });
          order.payoutReleased80 = true;
        }
      }
      
      // Safety: Ensure rider gets their first 50% if they haven't yet (status might have jumped)
      if (order.riderUid && !order.pickedUpAt) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const firstHalf = (order.riderFee || 0) * 0.5;
          rider.walletBalance = (Number(rider.walletBalance) || 0) + firstHalf;
          await rider.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: rider.uid,
            type: 'deposit',
            amount: firstHalf,
            desc: `Rider Fee (1st Half) - Order #${order.id} (Auto-credited on Washing)`,
            status: 'completed',
            date: new Date()
          });
          order.pickedUpAt = new Date();
        }
      }
    }

    if (status === 'ready') order.readyAt = new Date();

    if (status === 'completed' && !order.payoutReleased20) {
      order.completedAt = new Date();
      if (order.vendorId) {
        const vendor = await User.findOne({ uid: order.vendorId });
        if (vendor) {
          const platformFeeFactor = 0.9;
          const netVendorAmount = (order.itemsPrice || 0) * platformFeeFactor;
          const payoutAmount = netVendorAmount * 0.2;
          
          vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
          await vendor.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: vendor.uid,
            type: 'deposit',
            amount: payoutAmount,
            desc: `Order #${order.id} - 20% Final Payout - Net after 10% fee`,
            status: 'completed',
            date: new Date()
          });
          order.payoutReleased20 = true;
        }
      }
    }

    order.status = status;
    order.color = color;
    await order.save();

    res.json(order.toObject());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req: any, res: Response) => {
  const { role, uid } = req.user;
  let query: any = {};
  
  if (role === 'customer') {
    query = { customerUid: uid };
  } else if (role === 'vendor') {
    query = { vendorId: uid };
  } else if (role === 'rider') {
    // Riders see orders assigned to them OR unassigned available orders
    query = {
      $or: [
        { riderUid: uid },
        { 
          $and: [
            { $or: [{ riderUid: { $exists: false } }, { riderUid: null }, { riderUid: "" }] },
            { status: { $in: ['rider_assign_pickup', 'rider_assign_delivery'] } }
          ]
        }
      ]
    };
  }
  
  const orders = await Order.find(query).sort({ createdAt: -1 });
  
  // Transform orders to mask codes based on role
  const maskedOrders = orders.map(o => {
    const order = o.toObject();
    
    if (role === 'vendor') {
      // Vendor should not see codes 1 & 2
      delete order.code1;
      delete order.code2;
      // Vendor needs code3 to give to rider
      // Vendor should not see code4
      delete order.code4;
    } else if (role === 'rider') {
      // Rider should not see code1 (they get it from customer)
      delete order.code1;
      // Rider should not see code3 (they get it from vendor)
      delete order.code3;
      
      // Rider only sees code2 if they've picked up from customer
      if (order.status !== 'picked_up') {
        delete order.code2;
      }
      // Rider only sees code4 if they've picked up from vendor
      if (order.status !== 'picked_up_delivery') {
        delete order.code4;
      }
    } else if (role === 'customer') {
      // Customer needs code1 to give to rider
      // Customer should not see code2
      delete order.code2;
      // Customer should not see code3
      delete order.code3;
      // Customer gets code4 from rider
      delete order.code4;
    }
    
    return order;
  });

  res.json(maskedOrders);
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();
    res.status(201).json(order.toObject());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
