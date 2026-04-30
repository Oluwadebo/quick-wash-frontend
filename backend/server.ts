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

// Routes Imports
import { seedAdmin } from "./lib/seed";
import orderRoutes from "./routes/orderRoutes";
import priceRoutes from "./routes/priceRoutes";
import systemRoutes from "./routes/systemRoutes";
import userRoutes from "./routes/userRoutes";
import walletRoutes from "./routes/walletRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import inviteRoutes from "./routes/inviteRoutes";

dotenv.config();

const app = express();
// Robust trust proxy setting for AI Studio/Cloud Run environment
app.set("trust proxy", true); 
const PORT = process.env.BACKEND_PORT || 5000;
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
// Mount systemRoutes at root to allow /api/stats and /api/settings
app.use("/api", systemRoutes); 

app.get("/api/vendors", async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor', isApproved: true });
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

app.get("/api/health", (req, res) => {
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

    await seedAdmin();

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
