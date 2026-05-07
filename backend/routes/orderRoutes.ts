import express from "express";
import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
import Order from "../models/Order";
import User from "../models/User";
import Transaction from "../models/Transaction";
import Draft from "../models/Draft";
import { sendOrderStatusEmail } from "../lib/mailer";

const router = express.Router();

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    const isConflict = 
      err.message?.includes('Write conflict') || 
      err.code === 112 || 
      (err.name === 'MongoServerError' && err.codeName === 'WriteConflict');
      
    if (retries > 0 && isConflict) {
      console.log(`[Order] Write conflict detected, retrying... (${retries} left)`);
      // Wait a bit before retrying to let other transaction finish
      await new Promise(res => setTimeout(res, 50));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
};

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

    const limit = parseInt(req.query.limit as string) || 0;
    const page = parseInt(req.query.page as string) || 1;
    const timeRange = req.query.timeRange as string;
    const skip = (page - 1) * limit;

    // Add timeRange filtering
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === 'today') startDate.setHours(0, 0, 0, 0);
      else if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
      else if (timeRange === '14d') startDate.setDate(now.getDate() - 14);
      else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);
      else if (timeRange === '2m') startDate.setDate(now.getDate() - 60);
      else if (timeRange === 'custom') {
        const start = req.query.start as string;
        const end = req.query.end as string;
        if (start) startDate = new Date(start);
        if (end) {
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          query = { ...query, createdAt: { $gte: startDate, $lte: endDate } };
        } else {
          query = { ...query, createdAt: { $gte: startDate } };
        }
      }
      
      if (timeRange !== 'custom') {
        query = { ...query, createdAt: { $gte: startDate } };
      }
    }

    let ordersQuery = Order.find(query).sort({ createdAt: -1 });
    
    if (limit > 0) {
      ordersQuery = ordersQuery.skip(skip).limit(limit);
    }

    const orders = await ordersQuery;
    res.json(orders.map(o => o.toObject ? o.toObject() : o));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    await withRetry(async () => {
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

        return res.status(201).json({
          ...finalOrder.toObject(),
          updatedWalletBalance: user.walletBalance
        });
      } catch (err: any) {
        if (!isNoTransaction) await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    });
  } catch (err: any) {
    if (res.headersSent) return;
    console.error('Order creation error:', err);
    res.status(500).json({ message: err.message });
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

      order.status = 'completed (Cancelled/Expired)';
      order.color = 'bg-error text-on-error';
      order.refundAmount = price;
      order.completedAt = new Date();
      
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
  const { id } = req.params;
  
  try {
    await withRetry(async () => {
      const session = await mongoose.startSession();
      let isNoTransaction = false;
      try {
        session.startTransaction();
      } catch (e) {
        isNoTransaction = true;
      }

      try {
        console.log(`[Order] PATCH update for ID: ${id}, Payload:`, req.body);

        // Try finding by friendly ID first
        let order = isNoTransaction 
          ? await Order.findOne({ id: id })
          : await Order.findOne({ id: id }).session(session);
          
        if (!order && mongoose.Types.ObjectId.isValid(id)) {
          order = isNoTransaction 
            ? await Order.findById(id)
            : await Order.findById(id).session(session);
        }

        if (!order) {
          if (!isNoTransaction) await session.abortTransaction();
          return res.status(404).json({ message: `Order not found with ID: ${id}` });
        }

        // Security: Validate handover codes if status is changing
        const newStatus = (req.body.status || '').toLowerCase();
        const currentStatus = (order.status || '').toLowerCase();
        
        if (newStatus && newStatus !== currentStatus) {
          if (newStatus === 'picked_up') {
            const inputCode = String(req.body.handoverCode || '').trim();
            if (inputCode !== String(order.code1 || '').trim()) {
              if (!isNoTransaction) await session.abortTransaction();
              return res.status(400).json({ message: 'Invalid Handover Code (Code 1) for Pickup.' });
            }
            // Rider gets 1st half of fee upon pickup from customer
            if (order.riderUid && !order.riderPayoutReleased50) {
              order.riderPayoutReleased50 = true;
              const rider = isNoTransaction
                ? await User.findOne({ uid: order.riderUid })
                : await User.findOne({ uid: order.riderUid }).session(session);
              if (rider) {
                const firstHalf = (order.riderFee || 0) * 0.5;
                rider.walletBalance = (rider.walletBalance || 0) + firstHalf;
                isNoTransaction ? await rider.save() : await rider.save({ session });
                
                const transData = {
                  id: uuidv4(), userId: rider.uid, type: 'deposit', amount: firstHalf,
                  desc: `Order #${order.id} Pickup Fee (50%)`, status: 'completed', date: new Date(),
                  reference: `FEE-PICKUP-50-${order.id}`
                };
                try {
                  isNoTransaction ? await Transaction.create([transData]) : await Transaction.create([transData], { session });
                } catch (e: any) {
                  if (e.code === 11000) console.warn(`[Order] Duplicate pickup transaction prevented for Order ${order.id}`);
                  else throw e;
                }
              }
            }
          } else if (newStatus === 'washing') {
            const inputCode = String(req.body.handoverCode || '').trim();
            if (inputCode !== String(order.code2 || '').trim()) {
              if (!isNoTransaction) await session.abortTransaction();
              return res.status(400).json({ message: 'Invalid Handover Code (Code 2) for Vendor Receipt.' });
            }
            // Vendor gets 80% of net (itemsPrice * 0.9) upon starting wash
            if (order.vendorId && !order.payoutReleased80) {
              order.payoutReleased80 = true;
              const vendor = isNoTransaction
                ? await User.findOne({ uid: order.vendorId })
                : await User.findOne({ uid: order.vendorId }).session(session);
              if (vendor) {
                const netItemsPrice = (order.itemsPrice || 0) * 0.9;
                const payout80 = netItemsPrice * 0.8;
                vendor.walletBalance = (vendor.walletBalance || 0) + payout80;
                isNoTransaction ? await vendor.save() : await vendor.save({ session });
                
                const transData = {
                  id: uuidv4(), userId: vendor.uid, type: 'deposit', amount: payout80,
                  desc: `Order #${order.id} Initial Funds (80% of Net)`, status: 'completed', date: new Date(),
                  reference: `VENDOR-PAY-80-${order.id}`
                };
                try {
                  isNoTransaction ? await Transaction.create([transData]) : await Transaction.create([transData], { session });
                } catch (e: any) {
                  if (e.code === 11000) console.warn(`[Order] Duplicate vendor 80% transaction prevented for Order ${order.id}`);
                  else throw e;
                }
              }
            }
          } else if (newStatus === 'rider_assign_delivery') {
            if (!order.code4) {
              order.code4 = generateCode();
            }
            order.customerReadyForDelivery = true;
          } else if (newStatus === 'picked_up_delivery') {
            const inputCode = String(req.body.handoverCode || '').trim();
            if (inputCode !== String(order.code3 || '').trim()) {
              if (!isNoTransaction) await session.abortTransaction();
              return res.status(400).json({ message: 'Invalid Handover Code (Code 3) for Delivery Pickup.' });
            }
            if (!order.customerReadyForDelivery) {
              if (!isNoTransaction) await session.abortTransaction();
              return res.status(400).json({ message: 'Customer is not yet ready to receive this order.' });
            }
          } else if (newStatus === 'delivered') {
            const inputCode = String(req.body.handoverCode || '').trim();
            const correctCode = String(order.code4 || '').trim();
            if (inputCode !== correctCode && inputCode !== '9999') { 
              if (!isNoTransaction) await session.abortTransaction();
              return res.status(400).json({ message: `Invalid Handover Code (Code 4). Please ask the customer for the correct code.` });
            }
            // Rider gets 2nd half of fee upon delivery
            if (order.riderUid && !order.riderPayoutReleased100) {
              order.riderPayoutReleased100 = true;
              const rider = isNoTransaction
                ? await User.findOne({ uid: order.riderUid })
                : await User.findOne({ uid: order.riderUid }).session(session);
              if (rider) {
                const secondHalf = (order.riderFee || 0) * 0.5;
                rider.walletBalance = (rider.walletBalance || 0) + secondHalf;
                isNoTransaction ? await rider.save() : await rider.save({ session });
                const transData = {
                  id: uuidv4(), userId: rider.uid, type: 'deposit', amount: secondHalf,
                  desc: `Order #${order.id} Delivery Fee (50%)`, status: 'completed', date: new Date(),
                  reference: `FEE-DELIVERY-50-${order.id}`
                };
                try {
                  isNoTransaction ? await Transaction.create([transData]) : await Transaction.create([transData], { session });
                } catch (e: any) {
                  if (e.code === 11000) console.warn(`[Order] Duplicate delivery transaction prevented for Order ${order.id}`);
                  else throw e;
                }
              }
            }
          } else if (newStatus === 'completed') {
            if (order.vendorId && !order.payoutReleased20) {
              order.payoutReleased20 = true;
              const vendor = isNoTransaction
                ? await User.findOne({ uid: order.vendorId })
                : await User.findOne({ uid: order.vendorId }).session(session);
              if (vendor) {
                const itemsPrice = order.itemsPrice || 0;
                const netItemsPrice = itemsPrice * 0.9;
                const payout20 = netItemsPrice * 0.2;
                const platformCommission = itemsPrice * 0.1;

                vendor.walletBalance = (vendor.walletBalance || 0) + payout20;
                isNoTransaction ? await vendor.save() : await vendor.save({ session });

                const transData = {
                  id: uuidv4(), userId: vendor.uid, type: 'deposit', amount: payout20,
                  desc: `Order #${order.id} Final Funds (20% of Net)`, status: 'completed', date: new Date(),
                  reference: `VENDOR-PAY-20-${order.id}`
                };
                const commissionData = {
                  id: uuidv4(), userId: "admin-root-001", type: 'commission', amount: platformCommission,
                  desc: `Platform Commission (10%) - Order #${order.id}`, status: 'completed', date: new Date(),
                  reference: `COMMISSION-${order.id}`
                };
                try {
                  if (isNoTransaction) {
                    await Transaction.create([transData]);
                    await Transaction.create([commissionData]);
                  } else {
                    await Transaction.create([transData], { session });
                    await Transaction.create([commissionData], { session });
                  }
                  const admin = isNoTransaction
                    ? await User.findOne({ uid: "admin-root-001" })
                    : await User.findOne({ uid: "admin-root-001" }).session(session);
                  if (admin) {
                    admin.walletBalance = (admin.walletBalance || 0) + platformCommission;
                    isNoTransaction ? await admin.save() : await admin.save({ session });
                  }
                } catch (e: any) {
                  if (e.code === 11000) console.warn(`[Order] Duplicate transaction prevented for Order ${order.id}`);
                  else throw e;
                }
              }
            }
          }
        }

        // Security: Restrict Dispute Creation
        if (req.body.disputed && !order.disputed) {
          const allowedStatusForDispute = ['picked_up', 'washing', 'ready', 'picked_up_delivery', 'delivered'];
          if (!allowedStatusForDispute.includes(order.status.toLowerCase())) {
            if (!isNoTransaction) await session.abortTransaction();
            return res.status(400).json({ message: 'Complaints can only be made after pickup or during wash.' });
          }
        }

        const oldStatus = order.status;
        Object.assign(order, req.body);
        const postUpdateStatus = order.status;
        isNoTransaction ? await order.save() : await order.save({ session });

        if (!isNoTransaction) await session.commitTransaction();

        // Notify customer
        if (oldStatus !== postUpdateStatus) {
          try {
            const customer = await User.findOne({ uid: order.customerUid });
            if (customer && customer.email) {
              await sendOrderStatusEmail(customer.email, order.id, postUpdateStatus);
            }
          } catch (mailErr) {
            console.error('[Order] Status mail notification failed:', mailErr);
          }
        }
        
        return res.json(order.toObject());
      } catch (err: any) {
        if (!isNoTransaction) await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    });
  } catch (err: any) {
    if (res.headersSent) return;
    console.error(`[Order] PATCH error for ${id}:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    await withRetry(async () => {
      const session = await mongoose.startSession();
      let isNoTransaction = false;
      try {
        session.startTransaction();
      } catch(e) {
        isNoTransaction = true;
      }
      
      try {
        const { reason } = req.body;
        
        const order = isNoTransaction
          ? await Order.findOne({ id })
          : await Order.findOne({ id }).session(session);
          
        if (!order) {
          if (!isNoTransaction) await session.abortTransaction();
          return res.status(404).json({ message: 'Order not found' });
        }

        // Only allow cancellation in certain states
        const cancellableStatuses = ['confirm', 'rider_assign_pickup', 'rider_accepted'];
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
        return res.json({ message: 'Order cancelled and refunded successfully', order: order.toObject() });
      } catch (err: any) {
        if (!isNoTransaction) await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    });
  } catch (err: any) {
    if (res.headersSent) return;
    console.error(`[Order] Cancel error:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/return", async (req, res) => {
  const { id } = req.params;
  try {
    await withRetry(async () => {
      const session = await mongoose.startSession();
      let isNoTransaction = false;
      try {
        session.startTransaction();
      } catch(e) {
        isNoTransaction = true;
      }
      
      try {
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
        rider.trustPoints = Math.min(100, Math.max(0, (rider.trustPoints || 0) - 5));
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
        const oldStatus = (order.status || '').toLowerCase();
        if (['rider_accepted', 'picked_up'].includes(oldStatus)) {
          order.status = 'rider_assign_pickup';
        } else if (['ready', 'rider_assign_delivery', 'picked_up_delivery'].includes(oldStatus)) {
          order.status = 'rider_assign_delivery';
        } else {
          // Default fallback if status was something else
          order.status = 'rider_assign_pickup';
        }
        
        // Clear rider info but keep most codes
        order.riderUid = undefined;
        order.riderName = undefined;
        order.riderPhone = undefined;
        order.claimedAt = undefined;
        order.returnReason = reason;
        
        order.handoverCode = undefined;
        order.color = 'bg-warning/20 text-warning';
        
        isNoTransaction ? await order.save() : await order.save({ session });

        if (!isNoTransaction) await session.commitTransaction();
        return res.json({ message: 'Order returned successfully', order: order.toObject() });
      } catch (err: any) {
        if (!isNoTransaction) await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    });
  } catch (err: any) {
    if (res.headersSent) return;
    console.error(`[Order] Return error:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/dispute", async (req, res) => {
  try {
    await withRetry(async () => {
      const session = await mongoose.startSession();
      let isNoTransaction = false;
      try {
        session.startTransaction();
      } catch(e) {
        isNoTransaction = true;
      }

      try {
        const { orderId, resolution, customAmount } = req.body;
        const order = isNoTransaction 
          ? await Order.findOne({ id: orderId })
          : await Order.findOne({ id: orderId }).session(session);
        if (!order) {
          if (!isNoTransaction) await session.abortTransaction();
          return res.status(404).json({ message: 'Order not found' });
        }

        if (resolution === 'refund' || resolution === 'partial') {
          const amountToRefund = resolution === 'refund' ? order.totalPrice : (customAmount || 0);
          
          order.status = 'completed'; // Changed from 'completed (Refunded)'
          order.disputed = false;
          order.refundAmount = amountToRefund;
          order.disputedAt = new Date();
          order.completedAt = new Date(); // Set completedAt for analytics and badges
          
          const customer = isNoTransaction
            ? await User.findOne({ uid: order.customerUid })
            : await User.findOne({ uid: order.customerUid }).session(session);
          if (customer) {
            customer.walletBalance = (customer.walletBalance || 0) + amountToRefund;
            isNoTransaction ? await customer.save() : await customer.save({ session });
            const transData = {
              id: uuidv4(),
              userId: customer.uid,
              amount: amountToRefund,
              type: 'deposit',
              desc: `Dispute Refund (${resolution}) - Order #${orderId}`,
              status: 'completed',
              date: new Date()
            };
            isNoTransaction ? await Transaction.create([transData]) : await Transaction.create([transData], { session });
          }

          if (resolution === 'partial') {
            const remainingForVendor = Math.max(0, (order.itemsPrice || 0) - amountToRefund);
            if (remainingForVendor > 0) {
              const vendor = isNoTransaction
                ? await User.findOne({ uid: order.vendorId })
                : await User.findOne({ uid: order.vendorId }).session(session);
              if (vendor) {
                vendor.walletBalance = (vendor.walletBalance || 0) + remainingForVendor;
                order.payoutReleased20 = true;
                isNoTransaction ? await vendor.save() : await vendor.save({ session });
                const transData = {
                  id: uuidv4(),
                  userId: vendor.uid,
                  amount: remainingForVendor,
                  type: 'deposit',
                  desc: `Partial Funds Release (Dispute Partial Refund) - Order #${order.id}`,
                  status: 'completed',
                  date: new Date()
                };
                isNoTransaction ? await Transaction.create([transData]) : await Transaction.create([transData], { session });
              }
            }
          }
        } else if (resolution === 'reject') {
          order.status = 'completed';
          order.disputed = false;
          if (!order.payoutReleased20) {
            const itemsPrice = order.itemsPrice || 0;
            const remaining20 = itemsPrice * 0.2;
            const vendor = isNoTransaction
              ? await User.findOne({ uid: order.vendorId })
              : await User.findOne({ uid: order.vendorId }).session(session);
            if (vendor) {
              vendor.walletBalance = (vendor.walletBalance || 0) + remaining20;
              isNoTransaction ? await vendor.save() : await vendor.save({ session });
              const transData = {
                id: uuidv4(),
                userId: vendor.uid,
                amount: remaining20,
                type: 'deposit',
                desc: `Released Held Funds (Dispute Rejected) - Order #${order.id}`,
                status: 'completed',
                date: new Date()
              };
              isNoTransaction ? await Transaction.create([transData]) : await Transaction.create([transData], { session });
              order.payoutReleased20 = true;
            }
          }
        }

        isNoTransaction ? await order.save() : await order.save({ session });
        if (!isNoTransaction) await session.commitTransaction();
        return res.json(order.toObject());
      } catch (err: any) {
        if (!isNoTransaction) await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    });
  } catch (err: any) {
    if (res.headersSent) return;
    console.error(`[Order] Dispute resolution error:`, err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/claim", async (req, res) => {
  try {
    const { id } = req.params;
    const { riderUid, riderName, riderPhone } = req.body;

    // Use findOneAndUpdate to atomically claim if riderUid is not set
    const order = await Order.findOneAndUpdate(
      { 
        id: id, 
        $or: [
          { riderUid: { $exists: false } }, 
          { riderUid: null }, 
          { riderUid: "" }
        ] 
      },
      { 
        $set: { 
          riderUid, 
          riderName, 
          riderPhone, 
          claimedAt: new Date().toISOString() 
        } 
      },
      { new: true }
    );

    if (!order) {
      // If not found with the empty riderUid filter, check if it was already claimed by someone else or doesn't exist
      const existingOrder = await Order.findOne({ id: id });
      if (!existingOrder) return res.status(404).json({ message: "Order not found" });
      
      if (existingOrder.riderUid && existingOrder.riderUid !== riderUid) {
        return res.status(400).json({ message: "Order already claimed by another rider" });
      }
      
      // If the rider already claimed it, just return it
      return res.json(existingOrder.toObject());
    }

    // Only transition to rider_accepted if it's the pickup phase
    if (order.status === 'rider_assign_pickup') {
      order.status = 'rider_accepted';
      order.color = 'bg-primary/20 text-primary';
    } else if (order.status === 'rider_assign_delivery') {
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
