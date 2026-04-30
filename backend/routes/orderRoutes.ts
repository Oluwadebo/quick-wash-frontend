import express from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import Order from "../models/Order";
import User from "../models/User";
import Transaction from "../models/Transaction";
import Draft from "../models/Draft";

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
    res.json(orders.map(o => o.toObject ? o.toObject() : o));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const data = req.body;
    const { customerUid, paymentMethod, totalPrice } = data;
    
    console.log(`[Order] Creating order for user: ${customerUid}, method: ${paymentMethod}, price: ${totalPrice}`);

    // Check user and balance
    const user = await User.findOne({ uid: customerUid }).session(session);
    if (!user) {
      await session.abortTransaction();
      console.error(`[Order] User not found: ${customerUid}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const normalizedPaymentMethod = (paymentMethod || 'wallet').toLowerCase();
    const isWalletPayment = normalizedPaymentMethod === 'wallet';
    const price = Number(totalPrice) || 0;

    if (isWalletPayment) {
      const balance = Number(user.walletBalance) || 0;
      if (balance < price) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient wallet balance. Needed: ₦${price}, Balance: ₦${balance}` });
      }
      user.walletBalance = balance - price;
      await user.save({ session });
    }

    // Generate a more robust unique ID
    const generateId = async () => {
      const count = await Order.countDocuments();
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
      return `QW${dateStr}${count + 1}${Math.floor(Math.random() * 899 + 100)}`;
    };

    let finalId = data.id || await generateId();
    
    // Check if ID already exists
    const existingOrderCheck = await Order.findOne({ id: finalId }).session(session);
    if (existingOrderCheck) {
      finalId = await generateId();
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

    let finalOrder;
    try {
      const [order] = await Order.create([orderData], { session });
      finalOrder = order;
    } catch (saveErr: any) {
      if (saveErr.code === 11000) {
        orderData.id = `QW${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const [order] = await Order.create([orderData], { session });
        finalOrder = order;
      } else {
        throw saveErr;
      }
    }

    // Record Transaction
    if (isWalletPayment) {
      await Transaction.create([{
        id: uuidv4(),
        userId: customerUid,
        type: 'withdrawal',
        amount: price,
        desc: `Order #${finalOrder.id} Payment`,
        status: 'completed',
        method: 'wallet',
        reference: `ORD-${finalOrder.id}`,
        date: new Date()
      }], { session });
    }

    await session.commitTransaction();

    // Clean up draft after successful order
    try {
      if (customerUid && data.vendorId) {
        await Draft.findOneAndDelete({ userId: customerUid, vendorId: data.vendorId });
      }
    } catch (e) {
      console.error('Failed to cleanup draft:', e);
    }

    res.status(201).json({
      ...finalOrder.toObject(),
      updatedWalletBalance: user.walletBalance
    });
  } catch (err: any) {
    await session.abortTransaction();
    console.error('Order creation error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

router.post("/auto-cancel", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const expiredTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    
    // Find orders that are still in 'confirm' status and older than 30 minutes
    const expiredOrders = await Order.find({
      status: { $in: ['confirm', 'rider_assign_pickup'] },
      createdAt: { $lt: expiredTime }
    }).session(session);

    const results = [];

    for (const order of expiredOrders) {
      if (order.status === 'Cancelled' || order.status.includes('Refunded')) continue;

      const price = order.totalPrice;
      const customerUid = order.customerUid;

      // Refund
      if (order.paymentMethod === 'wallet') {
        const user = await User.findOne({ uid: customerUid }).session(session);
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + price;
          await user.save({ session });

          await Transaction.create([{
            id: uuidv4(),
            userId: customerUid,
            type: 'deposit',
            amount: price,
            desc: `Auto-Refund for Expired Order #${order.id}`,
            status: 'completed',
            method: 'wallet',
            reference: `AUTO-REF-${order.id}`,
            date: new Date()
          }], { session });
        }
      }

      order.status = 'Cancelled (Expired)';
      order.color = 'bg-error text-on-error';
      order.refundAmount = price;
      await order.save({ session });
      
      results.push(order.id);
    }

    await session.commitTransaction();
    res.json({ processed: results.length, orderIds: results });
  } catch (err: any) {
    await session.abortTransaction();
    console.error('Auto-cancel error:', err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
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
    
    res.json(order.toObject());
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
    res.json(order.toObject());
  } catch (err: any) {
    console.error(`[Order] PATCH error for ${req.params.id}:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/cancel", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findOne({ id }).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation in certain states
    const cancellableStatuses = ['confirm', 'rider_assign_pickup'];
    if (!cancellableStatuses.includes(order.status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Orders in ${order.status} status cannot be cancelled.` });
    }

    // Prevent double refund
    if (order.status === 'Cancelled' || order.status.includes('Refunded')) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Order is already cancelled or refunded.' });
    }

    const price = order.totalPrice;
    const customerUid = order.customerUid;

    // 1. Process Refund if wallet used
    if (order.paymentMethod === 'wallet') {
      const user = await User.findOne({ uid: customerUid }).session(session);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + price;
        await user.save({ session });

        await Transaction.create([{
          id: uuidv4(),
          userId: customerUid,
          type: 'deposit',
          amount: price,
          desc: `Refund for Cancelled Order #${order.id}${reason ? `: ${reason}` : ''}`,
          status: 'completed',
          method: 'wallet',
          reference: `REF-${order.id}`,
          date: new Date()
        }], { session });
      }
    }

    // 2. Update Order Status
    order.status = 'Cancelled';
    order.color = 'bg-error text-on-error';
    order.refundAmount = price;
    await order.save({ session });

    await session.commitTransaction();
    console.log(`[Order] Order ${order.id} cancelled and refunded successfully.`);
    res.json({ message: 'Order cancelled and refunded successfully', order: order.toObject() });
  } catch (err: any) {
    await session.abortTransaction();
    console.error(`[Order] Cancel error:`, err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

router.post("/:id/return", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { riderUid, reason } = req.body;
    
    const order = await Order.findOne({ id }).session(session);
    const rider = await User.findOne({ uid: riderUid }).session(session);
    
    if (!order || !rider || order.riderUid !== riderUid) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid order or rider.' });
    }

    // 1. Deduct ₦200 from wallet
    const penaltyFee = 200;
    rider.walletBalance = Math.max(0, (rider.walletBalance || 0) - penaltyFee);
    
    // 2. Track consecutive returns
    rider.consecutiveReturns = (rider.consecutiveReturns || 0) + 1;
    
    // 3. Check for 3 consecutive returns -> 2 day suspension
    if (rider.consecutiveReturns >= 3) {
      rider.status = 'suspended';
      rider.restrictionExpires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      rider.consecutiveReturns = 0; // Reset
    }

    // 4. Deduct 5 trust points
    rider.trustPoints = (rider.trustPoints || 0) - 5;
    rider.lastPenaltyAt = new Date();
    await rider.save({ session });

    // 5. Record transaction
    await Transaction.create([{
      id: uuidv4(),
      userId: riderUid,
      type: 'withdrawal',
      amount: penaltyFee,
      desc: `Order Return Penalty - Order #${order.id}`,
      status: 'completed',
      method: 'wallet',
      reference: `RET-PEN-${order.id}`,
      date: new Date()
    }], { session });

    // 6. Reset order status and codes
    const oldStatus = order.status;
    order.status = oldStatus === 'picked_up' ? 'rider_assign_pickup' : 
                  oldStatus === 'picked_up_delivery' ? 'rider_assign_delivery' : 
                  oldStatus;
    order.riderUid = undefined;
    order.riderName = undefined;
    order.riderPhone = undefined;
    order.returnReason = reason;
    order.code2 = null;
    order.code4 = null;
    order.handoverCode = null;
    order.color = 'bg-warning/20 text-warning';
    
    await order.save({ session });

    await session.commitTransaction();
    res.json({ message: 'Order returned successfully', order: order.toObject() });
  } catch (err: any) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
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
          id: uuidv4(),
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
              id: uuidv4(),
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
            id: uuidv4(),
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
    res.json(order.toObject());
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Order] DELETE request for ID: ${id}`);
    let order = await Order.findOneAndDelete({ id: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findByIdAndDelete(id);
    }
    if (!order) {
      console.warn(`[Order] DELETE failed: Order not found for ID: ${id}`);
      return res.status(404).json({ message: "Order not found" });
    }
    console.log(`[Order] DELETE success for ID: ${id}`);
    res.json({ message: "Order deleted successfully" });
  } catch (err: any) {
    console.error(`[Order] DELETE error for ${req.params.id}:`, err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
