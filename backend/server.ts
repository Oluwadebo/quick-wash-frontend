// import dns from "dns";
// dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
// dns.setDefaultResultOrder("ipv4first");

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import User from "./models/User";
import Transaction from "./models/Transaction";
import { v4 as uuidv4 } from "uuid";

// Routes Imports
import { seedAdmin } from "./lib/seed";
import orderRoutes from "./routes/orderRoutes";
import priceRoutes from "./routes/priceRoutes";
import systemRoutes from "./routes/systemRoutes";
import userRoutes from "./routes/userRoutes";
import walletRoutes from "./routes/walletRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import draftRoutes from "./routes/draftRoutes";

dotenv.config();

const app = express();
// Robust trust proxy setting for AI Studio/Cloud Run environment
app.set("trust proxy", 1); 
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quick-wash";

// Process level handlers for backend stability
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Backend] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Backend] Uncaught Exception:', error);
  // Optional: Graceful shutdown or restart logic
});

app.use(helmet());
app.use(morgan("dev"));

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        process.env.FRONTEND_URL
      ].filter(Boolean) as string[];
      
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Increased to prevent issues with polling and high interaction
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
});
app.use("/api/", limiter);

app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes); // Alias for auth routes
app.use("/api/admin/users", userRoutes); // For user management
app.use("/api/admin/invite", inviteRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/vendor/prices", priceRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/drafts", draftRoutes);
// Mount systemRoutes at root to allow /api/stats and /api/settings
app.use("/api", systemRoutes); 

app.get("/api/vendors", async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' });
    const vendorData = vendors.map(v => ({
      uid: v.uid,
      shopName: v.shopName || v.fullName || 'Anonymous Vendor',
      fullName: v.fullName,
      phoneNumber: v.phoneNumber,
      shopAddress: v.shopAddress || v.address,
      landmark: v.landmark,
      turnaroundTime: v.turnaroundTime || '24h Standard',
      trustPoints: v.trustPoints,
      isApproved: v.isApproved,
      shopImage: v.shopImage || `https://picsum.photos/seed/laundry-${v.phoneNumber}/800/600`
    }));
    res.json(vendorData);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/health", async (req, res) => {
  // Opportunity to re-seed if database was cleared manually while server was running
  await seedAdmin();
  res.json({ status: "ok", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.json({ message: "Quick-Wash Backend API Running" });
});

// Global Error Handler to ensure JSON response always
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Internal Server Error", 
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn(
      "⚠️ WARNING: MONGODB_URI environment variable is not defined.",
    );
    console.warn(
      "In local development, ensure MongoDB is running at 127.0.0.1:27017 or provide a URI.",
    );
  }

  console.log("Connecting to MongoDB...");
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    // --- DATABASE CLEANUP ---
    const cleanupDatabase = async () => {
      try {
        const collections = await mongoose.connection.db?.listCollections().toArray();
        if (!collections) return;

        // Cleanup Order index 'orderId_1' and others mentioned in user error
        if (collections.some(c => c.name === 'orders')) {
          const ordersCol = mongoose.connection.db!.collection('orders');
          try {
            await ordersCol.dropIndex('orderId_1');
            console.log('[Database] Forcefully dropped stale orderId_1 index');
          } catch (e) {
            // Index might not exist
          }
          
          try {
            // Check for other unnecessary unique indexes that might cause issues
            const indexes = await ordersCol.indexes();
            for (const idx of indexes) {
              if (idx.name && idx.name !== '_id_' && idx.name !== 'id_1' && idx.unique && !['customerUid_1', 'vendorId_1', 'status_1'].includes(idx.name)) {
                console.log(`[Database] Possible problematic unique index found: ${idx.name}. Consider dropping if it causes E11000.`);
              }
            }
          } catch (e) {}

          const orderCleanupResult = await mongoose.model('Order').deleteMany({ id: null });
          if (orderCleanupResult.deletedCount > 0) {
            console.log(`[Database] Cleaned up ${orderCleanupResult.deletedCount} orders with null IDs`);
          }
        }

        // Cleanup Transaction cleanup
        if (collections.some(c => c.name === 'transactions')) {
          const TransactionModel = mongoose.model('Transaction');
          const transCleanupResult = await TransactionModel.deleteMany({ id: null });
          if (transCleanupResult.deletedCount > 0) {
            console.log(`[Database] Cleaned up ${transCleanupResult.deletedCount} transactions with null IDs`);
          }
        }
      } catch (e: any) {
        console.error('[Database] Global cleanup error:', e.message);
      }
    };

    await cleanupDatabase();
    await seedAdmin();

    // --- Background Job for Order Timeouts (30 mins) ---
    const checkOrderTimeouts = async () => {
      try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const Order = mongoose.model('Order');
        const Transaction = mongoose.model('Transaction');
        
        // Find orders in 'confirm' or 'rider_assign_pickup' that are older than 30 mins
        const pendingOrders = await mongoose.model('Order').find({
          status: { $in: ["confirm", "rider_assign_pickup"] },
          $or: [
            { paidAt: { $lt: thirtyMinutesAgo } },
            { time: { $lt: thirtyMinutesAgo }, paidAt: { $exists: false } }
          ]
        });

        if (pendingOrders.length > 0) {
          console.log(`[Auto-Timeout] Found ${pendingOrders.length} stale orders for refund.`);
          
          for (const order of pendingOrders) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
              const freshOrder = await mongoose.model('Order').findById(order._id).session(session);
              if (!freshOrder || !["confirm", "rider_assign_pickup"].includes(freshOrder.status)) {
                await session.abortTransaction();
                session.endSession();
                continue;
              }

              if (freshOrder.paymentMethod === 'wallet') {
                const user = await mongoose.model('User').findOne({ uid: freshOrder.customerUid }).session(session);
                if (user) {
                  user.walletBalance = (user.walletBalance || 0) + freshOrder.totalPrice;
                  await user.save({ session });

                  await mongoose.model('Transaction').create([{
                    id: uuidv4(),
                    userId: user.uid,
                    type: 'deposit',
                    amount: freshOrder.totalPrice,
                    desc: `Auto-Refund (Timeout) - Order #${freshOrder.id}`,
                    status: 'completed',
                    method: 'wallet',
                    reference: `AUTO-REF-${freshOrder.id}`,
                    date: new Date()
                  }], { session });
                }
              }

              freshOrder.status = 'Refunded (Auto)';
              freshOrder.color = 'bg-error/20 text-error';
              freshOrder.refundAmount = freshOrder.totalPrice;
              await freshOrder.save({ session });

              await session.commitTransaction();
              console.log(`[Auto-Timeout] Order ${freshOrder.id} auto-refunded.`);
            } catch (err) {
              await session.abortTransaction();
              console.error(`[Auto-Timeout] Error processing ${order.id}:`, err);
            } finally {
              session.endSession();
            }
          }
        }
      } catch (err) {
        console.error("[Auto-Timeout] Global error:", err);
      }
    };
    setInterval(checkOrderTimeouts, 5 * 60 * 1000);
    // ---------------------------------------------------

    console.log(`Starting backend server on port ${PORT}...`);
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(
        `✅ Backend server successfully running on http://0.0.0.0:${PORT}`,
      );
    });
  } catch (err: any) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error(
      "Please verify that your database is running and the URI is correct. Continuing server start for proxy health...",
    );
    // Do not exit, keep process alive so proxy doesn't ECONNREFUSED
    // process.exit(1);
    
    console.log(`Starting backend server on port ${PORT} (DB OFFLINE)...`);
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(
        `✅ Backend server successfully running on http://0.0.0.0:${PORT} (Degraded Mode)`,
      );
    });
  }
};

startServer();

export default app;
