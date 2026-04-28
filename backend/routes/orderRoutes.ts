import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import User from "../models/User";
import Transaction from "../models/Transaction";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, role } = req.query;
    let query = {};
    
    if (role === 'customer') query = { customerUid: userId };
    else if (role === 'vendor') query = { vendorId: userId };
    else if (role === 'rider') query = { riderUid: userId };
    else if (role === 'admin' || role === 'super-sub-admin') {
       if (userId) query = { $or: [{ customerUid: userId }, { vendorId: userId }, { riderUid: userId }] };
       else query = {}; // See all
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const { customerUid, paymentMethod, totalPrice } = data;
    
    console.log(`[Order] Creating order for user: ${customerUid}, method: ${paymentMethod}, price: ${totalPrice}`);

    // Check user and balance
    const user = await User.findOne({ uid: customerUid });
    if (!user) {
      console.error(`[Order] User not found: ${customerUid}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const normalizedPaymentMethod = (paymentMethod || 'wallet').toLowerCase();
    const isWalletPayment = normalizedPaymentMethod === 'wallet';
    const price = Number(totalPrice) || 0;

    if (isWalletPayment) {
      const balance = Number(user.walletBalance) || 0;
      console.log(`[Order] Wallet Payment: Balance: ₦${balance}, Price: ₦${price}`);
      if (balance < price) {
        return res.status(400).json({ message: `Insufficient wallet balance. Needed: ₦${price}, Balance: ₦${balance}` });
      }
      user.walletBalance = balance - price;
      await user.save();
      console.log(`[Order] Wallet updated for ${customerUid}: ₦${user.walletBalance}`);
    }

    // Generate a more robust unique ID
    const generateRobustId = async () => {
      const count = await Order.countDocuments();
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
      const randomSuffix = Math.floor(Math.random() * 899 + 100); // 3 digits
      return `QW${dateStr}${count + 1}${randomSuffix}`;
    };

    let finalId = data.id;
    if (!finalId) {
      finalId = await generateRobustId();
    }
    
    // Check if ID already exists to prevent duplication
    const existingOrderCheck = await Order.findOne({ id: finalId });
    if (existingOrderCheck) {
      finalId = await generateRobustId();
    }

    // Generate handover codes
    const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();
    const orderData = {
      ...data,
      id: finalId,
      code1: data.code1 || generateCode(),
      code2: data.code2 || generateCode(),
      code3: data.code3 || generateCode(),
      code4: data.code4 || generateCode(),
      createdAt: new Date(),
      status: data.status || 'confirm'
    };

    // Ensure id uniqueness if collision happens
    let finalOrder;
    try {
      console.log(`[Order] Attempting to create order with ID: ${orderData.id}`);
      finalOrder = await Order.create(orderData);
      console.log(`[Order] Successfully created order: ${finalOrder.id} (Mongoose _id: ${finalOrder._id})`);
    } catch (saveErr: any) {
      if (saveErr.code === 11000) { // Duplicate key
        console.warn(`[Order] ID collision detected for ${orderData.id}, retrying with timestamp...`);
        orderData.id = `QW${Date.now()}${Math.floor(Math.random() * 1000)}`;
        finalOrder = await Order.create(orderData);
        console.log(`[Order] Successfully created order on second attempt: ${finalOrder.id}`);
      } else {
        console.error(`[Order] Creation failed: ${saveErr.message}`);
        throw saveErr;
      }
    }

    // Record Transaction
    if (isWalletPayment) {
      await Transaction.create({
        userId: customerUid,
        type: 'withdrawal',
        amount: price,
        desc: `Order #${finalOrder.id} Payment`,
        status: 'completed',
        method: 'wallet',
        reference: `ORD-${finalOrder.id}`,
        date: new Date()
      });
      console.log(`[Order] Transaction recorded for ${customerUid}`);
    }

    res.status(201).json({
      ...finalOrder.toObject(),
      updatedWalletBalance: user.walletBalance
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Order] GET lookup for ID: ${id}`);
    
    // Safety: check both friendly id and Mongoose _id
    let order = await Order.findOne({ id: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    
    if (!order) {
      console.warn(`[Order] GET lookup failed: Order not found for ID: ${id}`);
      return res.status(404).json({ message: `Order not found with ID: ${id}` });
    }
    
    res.json(order);
  } catch (err: any) {
    console.error(`[Order] GET lookup error for ${req.params.id}:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Order] PATCH update for ID: ${id}, Payload:`, req.body);

    // Try finding by friendly ID first
    let order = await Order.findOneAndUpdate(
      { id: id },
      { $set: req.body },
      { new: true }
    );

    // Fallback to Mongoose _id if not found
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );
    }

    if (!order) {
      console.error(`[Order] PATCH failed: Order not found with ID: ${id}`);
      return res.status(404).json({ message: `Order not found with ID: ${id}` });
    }
    
    console.log(`[Order] PATCH success: ${order.id} status changed to ${order.status}`);
    res.json(order);
  } catch (err: any) {
    console.error(`[Order] PATCH error for ${req.params.id}:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/dispute", async (req, res) => {
  try {
    const { orderId, resolution, customAmount } = req.body;
    const order = await Order.findOne({ id: orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (resolution === 'refund' || resolution === 'partial') {
      const amountToRefund = resolution === 'refund' ? order.totalPrice : (customAmount || 0);
      
      order.status = resolution === 'refund' ? 'Refunded (Full)' : `Refunded (Partial: ₦${amountToRefund})`;
      order.disputed = false;
      order.refundAmount = amountToRefund;
      order.disputedAt = new Date();
      
      const customer = await User.findOne({ uid: order.customerUid });
      if (customer) {
        customer.walletBalance = (customer.walletBalance || 0) + amountToRefund;
        await customer.save();
        await Transaction.create({
          userId: customer.uid,
          amount: amountToRefund,
          type: 'deposit',
          desc: `Dispute Refund (${resolution}) - Order #${orderId}`,
          status: 'completed',
          date: new Date()
        });
      }

      if (resolution === 'partial') {
        const remainingForVendor = Math.max(0, (order.itemsPrice || 0) - amountToRefund);
        if (remainingForVendor > 0) {
          const vendor = await User.findOne({ uid: order.vendorId });
          if (vendor) {
            vendor.walletBalance = (vendor.walletBalance || 0) + remainingForVendor;
            order.payoutReleased20 = true;
            await vendor.save();
            await Transaction.create({
              userId: vendor.uid,
              amount: remainingForVendor,
              type: 'deposit',
              desc: `Partial Funds Release (Dispute Partial Refund) - Order #${order.id}`,
              status: 'completed',
              date: new Date()
            });
          }
        }
      }
    } else if (resolution === 'reject') {
      order.status = 'completed';
      order.disputed = false;
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
            status: 'completed',
            date: new Date()
          });
          order.payoutReleased20 = true;
        }
      }
    }

    await order.save();
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
