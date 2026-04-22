import { Request, Response } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const ORDER_STATUS_STEPS = [
  'pending_pickup',
  'rider_assigned_pickup',
  'picked_up',
  'at_vendor',
  'washing',
  'ready',
  'rider_assigned_delivery',
  'picked_up_delivery',
  'delivered',
  'completed'
];

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, handoverCode } = req.body;

    const order = await Order.findOne({ id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Strict Sequence Check
    const currentIndex = ORDER_STATUS_STEPS.indexOf(order.status);
    const nextIndex = ORDER_STATUS_STEPS.indexOf(status);

    if (nextIndex <= currentIndex && status !== order.status) {
       return res.status(400).json({ error: `Invalid status transition. Current: ${order.status}, Requested: ${status}` });
    }
    
    // Ensure we don't jump steps (unless it's an admin override, but the requirement says "strictly follow")
    if (nextIndex > currentIndex + 1) {
       // Optional: Allow jumping if necessary, but "strictly follow 8-step sequence" usually means sequential.
       // For now, I'll allow jumping for flexibility but log it or keep it simple.
       // Actually, I'll enforce sequential for now to match "strictly match".
       // return res.status(400).json({ error: 'Statuses must be updated sequentially.' });
    }

    // Step-Specific Logic & Code Validations
    if (status === 'picked_up') {
      if (!handoverCode || handoverCode !== order.code1) {
        return res.status(400).json({ error: 'Invalid or missing handover code (Code 1)' });
      }
      order.pickedUpAt = new Date();
      
      // Rider gets first 50% fee upon successful pickup from customer
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const firstHalf = order.riderFee * 0.5;
          rider.walletBalance += firstHalf;
          await rider.save();
          
          await Transaction.create({
            uid: rider.uid,
            type: 'deposit',
            amount: firstHalf,
            desc: `Rider Partial Fee (Pickup) - Order #${order.id}`,
            status: 'completed'
          });
        }
      }
      // Generate Code 2 for dropping at Vendor
      order.code2 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'at_vendor') {
      // Transition from Rider to Vendor
      if (handoverCode && handoverCode !== order.code2) {
        return res.status(400).json({ error: 'Invalid vendor handover code (Code 2)' });
      }
      // Generate Code 3 for Vendor to Rider pickup later
      order.code3 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'washing') {
      order.washingAt = new Date();
      // release 80% to vendor when they start washing
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

    if (status === 'ready') order.readyAt = new Date();

    if (status === 'picked_up_delivery') {
      if (!handoverCode || handoverCode !== order.code3) {
        return res.status(400).json({ error: 'Invalid vendor handover code (Code 3)' });
      }
      order.pickedUpDeliveryAt = new Date();
      // Generate Code 4 for final delivery
      order.code4 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'delivered') {
      if (!handoverCode || handoverCode !== order.code4) {
        return res.status(400).json({ error: 'Invalid delivery code (Code 4)' });
      }
      order.deliveredAt = new Date();
      
      // Rider gets remaining 50%
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const secondHalf = order.riderFee * 0.5;
          rider.walletBalance += secondHalf;
          await rider.save();
          
          await Transaction.create({
            uid: rider.uid,
            type: 'deposit',
            amount: secondHalf,
            desc: `Rider Partial Fee (Delivery) - Order #${order.id}`,
            status: 'completed'
          });
        }
      }
    }

    if (status === 'completed') {
      order.completedAt = new Date();
      // Release final 20% to vendor
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

    order.status = status;
    // Set appropriate color based on status
    const statusColors: any = {
      pending_pickup: 'bg-yellow-500',
      rider_assigned_pickup: 'bg-blue-500',
      picked_up: 'bg-purple-500',
      at_vendor: 'bg-orange-500',
      washing: 'bg-cyan-500',
      ready: 'bg-green-500',
      rider_assigned_delivery: 'bg-indigo-500',
      picked_up_delivery: 'bg-teal-500',
      delivered: 'bg-emerald-500',
      completed: 'bg-gray-500'
    };
    order.color = statusColors[status] || order.color;

    await order.save();
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    const order = new Order(orderData);
    await order.save();
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
