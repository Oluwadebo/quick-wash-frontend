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

    // Handover Code Validation
    if (status === 'picked_up') {
      if (handoverCode !== order.code1) {
        return res.status(400).json({ error: 'Invalid pickup code' });
      }
      order.pickedUpAt = new Date();
      
      // Rider gets first 50% fee
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const firstHalf = order.riderFee * 0.5;
          rider.walletBalance = (Number(rider.walletBalance) || 0) + firstHalf;
          await rider.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: rider.uid,
            type: 'deposit',
            amount: firstHalf,
            desc: `Rider Fee (50%) - Order #${order.id}`,
            status: 'completed',
            date: new Date()
          });
        }
      }

      // Generate Code 2 for Vendor
      order.code2 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'picked_up_delivery') {
      if (handoverCode !== order.code3) {
        return res.status(400).json({ error: 'Invalid handover code from vendor' });
      }
      order.pickedUpDeliveryAt = new Date();
      // Generate Code 4 for Customer
      order.code4 = Math.floor(1000 + Math.random() * 9000).toString();
    }

    if (status === 'delivered') {
      if (handoverCode !== order.code4) {
        return res.status(400).json({ error: 'Invalid delivery code' });
      }
      order.deliveredAt = new Date();

      // Rider gets second 50% fee
      if (order.riderUid) {
        const rider = await User.findOne({ uid: order.riderUid });
        if (rider) {
          const secondHalf = order.riderFee * 0.5;
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

    if (status === 'washing' && !order.isPayout80Released) {
      order.washingAt = new Date();
      if (order.vendorId) {
        const vendor = await User.findOne({ uid: order.vendorId });
        if (vendor) {
          const payoutAmount = (order.itemsPrice || 0) * 0.8;
          vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
          await vendor.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: vendor.uid,
            type: 'deposit',
            amount: payoutAmount,
            desc: `Order #${order.id} - 80% Payout (Washing Started)`,
            status: 'completed',
            date: new Date()
          });
          order.isPayout80Released = true;
        }
      }
    }

    if (status === 'ready') order.readyAt = new Date();
    
    if (status === 'completed' && !order.isPayout20Released) {
      order.completedAt = new Date();
      if (order.vendorId) {
        const vendor = await User.findOne({ uid: order.vendorId });
        if (vendor) {
          const payoutAmount = (order.itemsPrice || 0) * 0.2;
          vendor.walletBalance = (vendor.walletBalance || 0) + payoutAmount;
          await vendor.save();
          
          await Transaction.create({
            id: uuidv4(),
            userId: vendor.uid,
            type: 'deposit',
            amount: payoutAmount,
            desc: `Order #${order.id} - 20% Final Payout`,
            status: 'completed',
            date: new Date()
          });
          order.isPayout20Released = true;
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
  let query = {};
  if (role === 'customer') query = { customerUid: uid };
  if (role === 'vendor') query = { vendorId: uid };
  if (role === 'rider') query = { riderUid: uid };
  
  const orders = await Order.find(query).sort({ createdAt: -1 });
  res.json(orders.map(o => o.toObject ? o.toObject() : o));
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
