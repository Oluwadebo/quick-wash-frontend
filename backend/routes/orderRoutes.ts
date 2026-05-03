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
    const userId = req.query.userId as string;
    const role = req.query.role as string;
    let query = {};
    
    if (role === 'customer') query = { customerUid: userId };
    else if (role === 'vendor') {
      // Vendors only see orders that are confirmed (paid) or beyond
      query = { 
        vendorId: userId,
        status: { $nin: ['draft', 'pending_payment', 'Cancelled (Expired)'] }
      };
    }
    else if (role === 'rider') {
      query = {
        $or: [
          { riderUid: userId },
          { 
            $and: [
              { $or: [{ riderUid: { $exists: false } }, { riderUid: null }, { riderUid: "" }] },
              { status: { $in: ['rider_assign_pickup', 'rider_assign_delivery'] } }
            ]
          }
        ]
      };
    }
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
  let isNoTransaction = false;
  try {
    session.startTransaction();
  } catch(e) {
    isNoTransaction = true;
  }
  
  try {
    const data = req.body;
    const { customerUid, paymentMethod, totalPrice } = data;
    
    console.log(`[Order] Creating order for user: ${customerUid}, method: ${paymentMethod}, price: ${totalPrice}`);

    // Check user and balance
    const user = isNoTransaction 
      ? await User.findOne({ uid: customerUid })
      : await User.findOne({ uid: customerUid }).session(session);
      
    if (!user) {
      if (!isNoTransaction) await session.abortTransaction();
      console.error(`[Order] User not found: ${customerUid}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const normalizedPaymentMethod = (paymentMethod || 'wallet').toLowerCase();
    const isWalletPayment = normalizedPaymentMethod === 'wallet';
    const price = Number(totalPrice) || 0;

    if (isWalletPayment) {
      const balance = Number(user.walletBalance) || 0;
      if (balance < price) {
        if (!isNoTransaction) await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient wallet balance. Needed: ₦${price}, Balance: ₦${balance}` });
      }
      user.walletBalance = balance - price;
      isNoTransaction ? await user.save() : await user.save({ session });
    }

    // Generate a more robust unique ID
    const generateId = async () => {
      const count = await Order.countDocuments();
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); 
      return `QW${dateStr}${count + 1}${Math.floor(Math.random() * 899 + 100)}`;
    };

    let finalId = data.id || await generateId();
    
    // Check if ID already exists
    const existingOrderCheck = isNoTransaction
      ? await Order.findOne({ id: finalId })
      : await Order.findOne({ id: finalId }).session(session);
      
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
      const [order] = isNoTransaction
        ? await Order.create([orderData])
        : await Order.create([orderData], { session });
      finalOrder = order;
    } catch (saveErr: any) {
      if (saveErr.code === 11000) {
        orderData.id = `QW${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const [order] = isNoTransaction
          ? await Order.create([orderData])
          : await Order.create([orderData], { session });
        finalOrder = order;
      } else {
        throw saveErr;
      }
    }

    // Record Transaction
    if (isWalletPayment) {
      const transData = {
        id: uuidv4(),
        userId: customerUid,
        type: 'withdrawal',
        amount: price,
        desc: `Order #${finalOrder.id} Payment`,
        status: 'completed',
        method: 'wallet',
        reference: `ORD-${finalOrder.id}`,
        date: new Date()
      };
      
      isNoTransaction
        ? await Transaction.create([transData])
        : await Transaction.create([transData], { session });
    }

    if (!isNoTransaction) await session.commitTransaction();

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
  try {
    session.startTransaction();
  } catch (e) {
    // Transaction not supported (standalone Mongo), continue without it
    (session as any).isNoTransaction = true;
  }
  
  try {
    const expiredTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    
    // Find orders that are still in 'confirm' status and older than 30 minutes
    const query: any = {
      status: { $in: ['confirm', 'rider_assign_pickup'] },
      createdAt: { $lt: expiredTime }
    };
    
    const expiredOrders = (session as any).isNoTransaction 
      ? await Order.find(query)
      : await Order.find(query).session(session);

    const results = [];

    for (const order of expiredOrders) {
      if (order.status === 'Cancelled' || order.status.includes('Refunded')) continue;

      const price = order.totalPrice;
      const customerUid = order.customerUid;

      // Refund
      if (order.paymentMethod === 'wallet') {
        const user = (session as any).isNoTransaction
          ? await User.findOne({ uid: customerUid })
          : await User.findOne({ uid: customerUid }).session(session);
          
        if (user) {
          user.walletBalance = (user.walletBalance || 0) + price;
          (session as any).isNoTransaction 
            ? await user.save() 
            : await user.save({ session });

          const transData = {
            id: uuidv4(),
            userId: customerUid,
            type: 'deposit',
            amount: price,
            desc: `Auto-Refund for Expired Order #${order.id}`,
            status: 'completed',
            method: 'wallet',
            reference: `AUTO-REF-${order.id}`,
            date: new Date()
          };
          
          (session as any).isNoTransaction
            ? await Transaction.create([transData])
            : await Transaction.create([transData], { session });
        }
      }

      order.status = 'Cancelled (Expired)';
      order.color = 'bg-error text-on-error';
      order.refundAmount = price;
      
      (session as any).isNoTransaction
        ? await order.save()
        : await order.save({ session });
      
      results.push(order.id);
    }

    if (!(session as any).isNoTransaction) {
      await session.commitTransaction();
    }
    res.json({ processed: results.length, orderIds: results });
  } catch (err: any) {
    if (!(session as any).isNoTransaction) {
      try { await session.abortTransaction(); } catch (e) {}
    }
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
    let order = await Order.findOne({ id: id });
    if (!order && mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }

    if (!order) {
      console.error(`[Order] Update failed: Order not found with ID: ${id}`);
      return res.status(404).json({ message: `Order not found with ID: ${id}` });
    }

    // Security: Validate handover codes if status is changing
    const newStatus = (req.body.status || '').toLowerCase();
    const currentStatus = (order.status || '').toLowerCase();
    
    if (newStatus !== currentStatus) {
      if (newStatus === 'picked_up') {
        const inputCode = String(req.body.handoverCode || '');
        if (inputCode !== String(order.code1 || '')) {
          return res.status(400).json({ message: 'Invalid Handover Code (Code 1) for Pickup.' });
        }
        // Rider gets 1st half of fee upon pickup from customer
        if (order.riderUid && !order.riderPayoutReleased50) {
          const rider = await User.findOne({ uid: order.riderUid });
          if (rider) {
            const firstHalf = (order.riderFee || 0) * 0.5;
            rider.walletBalance = (rider.walletBalance || 0) + firstHalf;
            await rider.save();
            order.riderPayoutReleased50 = true;
            await Transaction.create({
              id: uuidv4(), userId: rider.uid, type: 'deposit', amount: firstHalf,
              desc: `Order #${order.id} Pickup Fee (50%)`, status: 'completed', date: new Date()
            });
          }
        }
      } else if (newStatus === 'washing') {
        const inputCode = String(req.body.handoverCode || '');
        if (inputCode !== String(order.code2 || '')) {
          return res.status(400).json({ message: 'Invalid Handover Code (Code 2) for Vendor Receipt.' });
        }
        // Vendor gets 80% of net (itemsPrice * 0.9) upon starting wash
        if (order.vendorId && !order.payoutReleased80) {
          const vendor = await User.findOne({ uid: order.vendorId });
          if (vendor) {
            const netItemsPrice = (order.itemsPrice || 0) * 0.9;
            const payout80 = netItemsPrice * 0.8;
            vendor.walletBalance = (vendor.walletBalance || 0) + payout80;
            await vendor.save();
            order.payoutReleased80 = true;
            await Transaction.create({
              id: uuidv4(), userId: vendor.uid, type: 'deposit', amount: payout80,
              desc: `Order #${order.id} Initial Funds (80% of Net)`, status: 'completed', date: new Date()
            });
          }
        }
      } else if (newStatus === 'picked_up_delivery') {
        const inputCode = String(req.body.handoverCode || '');
        if (inputCode !== String(order.code3 || '')) {
          return res.status(400).json({ message: 'Invalid Handover Code (Code 3) for Delivery Pickup.' });
        }
        // Gate: Customer must be ready
        if (!order.customerReadyForDelivery) {
          return res.status(400).json({ message: 'Customer is not yet ready to receive this order. Please wait for the "Locked and Ready" confirmation.' });
        }
      } else if (newStatus === 'delivered') {
        const inputCode = String(req.body.handoverCode || '');
        if (inputCode !== String(order.code4 || '')) {
          return res.status(400).json({ message: 'Invalid Handover Code (Code 4) for Customer Delivery.' });
        }
        // Rider gets 2nd half of fee upon delivery
        if (order.riderUid && !order.riderPayoutReleased100) {
          const rider = await User.findOne({ uid: order.riderUid });
          if (rider) {
            const secondHalf = (order.riderFee || 0) * 0.5;
            rider.walletBalance = (rider.walletBalance || 0) + secondHalf;
            await rider.save();
            order.riderPayoutReleased100 = true;
            await Transaction.create({
              id: uuidv4(), userId: rider.uid, type: 'deposit', amount: secondHalf,
              desc: `Order #${order.id} Delivery Fee (50%)`, status: 'completed', date: new Date()
            });
          }
        }
      } else if (newStatus === 'completed') {
        // Vendor gets remaining 20% of net upon completion
        if (order.vendorId && !order.payoutReleased20) {
          const vendor = await User.findOne({ uid: order.vendorId });
          if (vendor) {
            const netItemsPrice = (order.itemsPrice || 0) * 0.9;
            const payout20 = netItemsPrice * 0.2;
            vendor.walletBalance = (vendor.walletBalance || 0) + payout20;
            await vendor.save();
            order.payoutReleased20 = true;
            await Transaction.create({
              id: uuidv4(), userId: vendor.uid, type: 'deposit', amount: payout20,
              desc: `Order #${order.id} Final Funds (20% of Net)`, status: 'completed', date: new Date()
            });
          }
        }
      }
    }

    // Perform the update
    Object.assign(order, req.body);
    await order.save();
    
    console.log(`[Order] PATCH success: ${order.id} status changed to ${order.status}`);
    res.json(order.toObject());
  } catch (err: any) {
    console.error(`[Order] PATCH error for ${req.params.id}:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/cancel", async (req, res) => {
  const session = await mongoose.startSession();
  let isNoTransaction = false;
  try {
    session.startTransaction();
  } catch(e) {
    isNoTransaction = true;
  }
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = isNoTransaction
      ? await Order.findOne({ id })
      : await Order.findOne({ id }).session(session);
      
    if (!order) {
      if (!isNoTransaction) await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation in certain states
    const cancellableStatuses = ['confirm', 'rider_assign_pickup'];
    if (!cancellableStatuses.includes(order.status)) {
      if (!isNoTransaction) await session.abortTransaction();
      return res.status(400).json({ message: `Orders in ${order.status} status cannot be cancelled.` });
    }

    // Prevent double refund
    if (order.status === 'Cancelled' || order.status.includes('Refunded')) {
      if (!isNoTransaction) await session.abortTransaction();
      return res.status(400).json({ message: 'Order is already cancelled or refunded.' });
    }

    const price = order.totalPrice;
    const customerUid = order.customerUid;

    // 1. Process Refund if wallet used
    if (order.paymentMethod === 'wallet') {
      const user = isNoTransaction
        ? await User.findOne({ uid: customerUid })
        : await User.findOne({ uid: customerUid }).session(session);
        
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + price;
        isNoTransaction ? await user.save() : await user.save({ session });

        const transData = {
          id: uuidv4(),
          userId: customerUid,
          type: 'deposit',
          amount: price,
          desc: `Refund for Cancelled Order #${order.id}${reason ? `: ${reason}` : ''}`,
          status: 'completed',
          method: 'wallet',
          reference: `REF-${order.id}`,
          date: new Date()
        };
        
        isNoTransaction
          ? await Transaction.create([transData])
          : await Transaction.create([transData], { session });
      }
    }

    // 2. Update Order Status
    order.status = 'Cancelled';
    order.color = 'bg-error text-on-error';
    order.refundAmount = price;
    isNoTransaction ? await order.save() : await order.save({ session });

    if (!isNoTransaction) await session.commitTransaction();
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
  let isNoTransaction = false;
  try {
    session.startTransaction();
  } catch(e) {
    isNoTransaction = true;
  }
  
  try {
    const { id } = req.params;
    const { riderUid, reason } = req.body;
    
    const order = isNoTransaction
      ? await Order.findOne({ id })
      : await Order.findOne({ id }).session(session);
      
    const rider = isNoTransaction
      ? await User.findOne({ uid: riderUid })
      : await User.findOne({ uid: riderUid }).session(session);
    
    if (!order || !rider || order.riderUid !== riderUid) {
      if (!isNoTransaction) await session.abortTransaction();
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
    isNoTransaction ? await rider.save() : await rider.save({ session });

    // 5. Record transaction
    const transData = {
      id: uuidv4(),
      userId: riderUid,
      type: 'withdrawal',
      amount: penaltyFee,
      desc: `Order Return Penalty - Order #${order.id}`,
      status: 'completed',
      method: 'wallet',
      reference: `RET-PEN-${order.id}`,
      date: new Date()
    };
    
    isNoTransaction
      ? await Transaction.create([transData])
      : await Transaction.create([transData], { session });

    // 6. Reset order status correctly based on where it was
    const oldStatus = order.status;
    if (oldStatus === 'rider_accepted' || oldStatus === 'picked_up') {
      order.status = 'rider_assign_pickup';
    } else if (oldStatus === 'picked_up_delivery') {
      order.status = 'rider_assign_delivery';
    }
    
    // Clear rider info but keep most codes
    order.riderUid = undefined;
    order.riderName = undefined;
    order.riderPhone = undefined;
    order.claimedAt = undefined;
    order.returnReason = reason;
    // We keep code1, code2, code3, code4 as they are per-order secrets
    // but we can clear the handoverInput shadow if any
    order.handoverCode = undefined;
    order.color = 'bg-warning/20 text-warning';
    
    isNoTransaction ? await order.save() : await order.save({ session });

    if (!isNoTransaction) await session.commitTransaction();
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

router.post("/:id/claim", async (req, res) => {
  try {
    const { id } = req.params;
    const { riderUid, riderName, riderPhone } = req.body;

    const order = await Order.findOne({ id: id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.riderUid && order.riderUid !== riderUid) {
      return res.status(400).json({ message: "Order already claimed by another rider" });
    }

    order.riderUid = riderUid;
    order.riderName = riderName;
    order.riderPhone = riderPhone;
    order.claimedAt = new Date().toISOString();

    // Only transition to rider_accepted if it's the pickup phase
    if (order.status === 'rider_assign_pickup') {
      order.status = 'rider_accepted';
      order.color = 'bg-primary/20 text-primary';
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
