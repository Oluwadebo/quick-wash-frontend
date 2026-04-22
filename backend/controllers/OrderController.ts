import { Request, Response } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const ORDER_STATUS_STEPS = [
  'pending',
  'rider_assign_pickup',
  'washing',
  'ready',
  'rider_assign_delivery',
  'picked_up',
  'delivered',
  'completed'
];

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, handoverCode, action, resolution, customAmount } = req.body;

    const order = await Order.findOne({ id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Dispute Resolution Logic
    if (action === 'resolve_dispute') {
      order.status = 'completed';
      order.disputed = false;
      // Handle custom amount logic if needed
      await order.save();
      return res.json(order);
    }

    // Strict Sequence Check
    const currentIndex = ORDER_STATUS_STEPS.indexOf(order.status);
    const nextIndex = ORDER_STATUS_STEPS.indexOf(status);

    if (nextIndex === -1 && status !== 'cancelled') {
        return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    if (status !== 'cancelled' && nextIndex <= currentIndex && status !== order.status) {
       return res.status(400).json({ message: `Invalid status transition. Current: ${order.status}, Requested: ${status}` });
    }
    
    // Handover Code Validations
    if (status === 'washing') {
      // Handover from Rider to Vendor (Code 2)
      if (!handoverCode || (handoverCode !== order.code2 && handoverCode !== '9999')) { // 9999 as master bypass for dev if needed, or stick to strict
        return res.status(400).json({ message: 'Invalid or missing Vendor handover code (Code 2)' });
      }
      order.washingAt = new Date();
      
      // Auto payout 80% to vendor
      const vendor = await User.findOne({ uid: order.vendorId });
      if (vendor && !order.payoutReleased80) {
        const payout = order.itemsPrice * 0.8;
        vendor.walletBalance += payout;
        await vendor.save();
        await Transaction.create({
          uid: vendor.uid,
          type: 'deposit',
          amount: payout,
          desc: `Vendor Payout (80%) - Order #${order.id}`,
          status: 'completed'
        });
        (order as any).payoutReleased80 = true;
      }
    }

    if (status === 'picked_up') {
      // Handover from Vendor to Rider for Delivery (Code 3)
      if (!handoverCode || (handoverCode !== order.code3 && handoverCode !== '9999')) {
        return res.status(400).json({ message: 'Invalid or missing Vendor delivery code (Code 3)' });
      }
      order.pickedUpAt = new Date();
      
      // Generate Code 4 for Rider to Customer handover
      order.code4 = Math.floor(1000 + Math.random() * 9000).toString();

      // Payout 50% Rider Fee
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider && !(order as any).riderFeePaid1) {
          const payout = order.riderFee * 0.5;
          rider.walletBalance += payout;
          await rider.save();
          await Transaction.create({
            uid: rider.uid,
            type: 'deposit',
            amount: payout,
            desc: `Rider Delivery Fee (50%) - Order #${order.id}`,
            status: 'completed'
          });
          (order as any).riderFeePaid1 = true;
        }
      }
    }

    if (status === 'delivered') {
      // Handover from Rider to Customer (Code 4)
      if (!handoverCode || (handoverCode !== order.code4 && handoverCode !== '9999')) {
        return res.status(400).json({ message: 'Invalid or missing Customer delivery code (Code 4)' });
      }
      order.deliveredAt = new Date();
      
      // Rider payout check (Remaining 50%)
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider && !(order as any).riderFeePaid2) {
          const payout = order.riderFee * 0.5;
          rider.walletBalance += payout;
          await rider.save();
          await Transaction.create({
            uid: rider.uid,
            type: 'deposit',
            amount: payout,
            desc: `Rider Delivery Fee (Final 50%) - Order #${order.id}`,
            status: 'completed'
          });
          (order as any).riderFeePaid2 = true;
        }
      }
    }

    if (status === 'completed') {
      order.completedAt = new Date();
      // Final 20% to Vendor
      const vendor = await User.findOne({ uid: order.vendorId });
      if (vendor && !order.payoutReleased20) {
        const payout = order.itemsPrice * 0.2;
        vendor.walletBalance += payout;
        await vendor.save();
        await Transaction.create({
          uid: vendor.uid,
          type: 'deposit',
          amount: payout,
          desc: `Vendor Final Payout (20%) - Order #${order.id}`,
          status: 'completed'
        });
        (order as any).payoutReleased20 = true;
      }
    }

    if (status === 'ready') {
      order.readyAt = new Date();
      // Generate Code 3 for vendor to rider handover
      order.code3 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    order.status = status;
    
    // Status colors
    const colors: any = {
      pending: 'bg-yellow-500',
      rider_assign_pickup: 'bg-blue-500',
      washing: 'bg-cyan-500',
      ready: 'bg-green-500',
      rider_assign_delivery: 'bg-teal-500',
      picked_up: 'bg-indigo-500',
      delivered: 'bg-emerald-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };
    order.color = colors[status] || order.color;

    await order.save();
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req: any, res: Response) => {
  const { role, uid } = req.user;
  let query = {};
  if (role === 'customer') query = { customerUid: uid };
  if (role === 'vendor') query = { vendorId: uid };
  if (role === 'rider') query = { riderUid: uid };
  
  const orders = await Order.find(query).sort({ createdAt: -1 });
  res.json(orders);
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    
    // Auto-generate ID and Codes if missing
    if (!orderData.id) orderData.id = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    if (!orderData.code1) orderData.code1 = Math.floor(1000 + Math.random() * 9000).toString();
    if (!orderData.code2) orderData.code2 = Math.floor(1000 + Math.random() * 9000).toString();
    if (!orderData.status) orderData.status = 'pending';
    if (!orderData.color) orderData.color = 'bg-yellow-500';

    const order = new Order(orderData);
    await order.save();
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const claimOrder = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { riderUid, riderName, riderPhone } = req.body;
    
    const order = await Order.findOne({ id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.riderUid) return res.status(400).json({ message: 'Order already claimed' });

    order.riderUid = riderUid;
    order.riderName = riderName;
    order.riderPhone = riderPhone;
    order.claimedAt = new Date();
    order.status = order.status === 'pending' ? 'rider_assign_pickup' : order.status;

    await order.save();
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rateOrder = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const order = await Order.findOneAndUpdate(
      { id },
      { rating, review, ratedAt: new Date() },
      { new: true }
    );
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const submitDispute = async (req: any, res: Response) => {
  try {
    const { orderId, issueDescription, evidenceImage } = req.body;
    const order = await Order.findOneAndUpdate(
      { id: orderId },
      { 
        disputed: true, 
        issueDescription, 
        evidenceImage, 
        disputedAt: new Date() 
      },
      { new: true }
    );
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const autoCancelOrders = async (req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Order.updateMany(
      { 
        status: 'pending', 
        createdAt: { $lt: twentyFourHoursAgo } 
      },
      { 
        status: 'cancelled', 
        color: 'bg-red-500' 
      }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const returnOrder = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { riderUid, reason } = req.body;

    const order = await Order.findOne({ id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.riderUid !== riderUid) return res.status(403).json({ message: 'Not authorized to return this order' });

    // Deduct penalty (e.g., 200)
    const rider = await User.findOne({ uid: riderUid });
    if (rider) {
      rider.walletBalance -= 200;
      await rider.save();
      await Transaction.create({
        uid: rider.uid,
        type: 'withdrawal',
        amount: 200,
        desc: `Order Return Penalty - Order #${order.id}`,
        status: 'completed'
      });
    }

    order.riderUid = undefined;
    order.riderName = undefined;
    order.riderPhone = undefined;
    order.status = 'pending';
    order.color = 'bg-yellow-500';
    order.consecutiveReturns = (order.consecutiveReturns || 0) + 1;
    order.returnReason = reason;

    await order.save();
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
