import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

// Routes Imports
import { seedAdmin } from "./lib/seed.js";
import orderRoutes from "./routes/orderRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quick-wash";

app.use(helmet());
app.use(morgan("dev"));

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(
      Boolean,
    ) as string[],
    methods: ["GET", "POST", "DELETE", "PATCH"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/", limiter);

app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/system", systemRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Quick-Wash Backend API Running" });
});

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn(
      "⚠️ WARNING: MONGODB_URI environment variable is not defined.",
    );
    console.warn(
      "In local development, ensure MongoDB is running at localhost:27017 or provide a URI.",
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

    // console.log(`Starting backend server on port ${PORT}...`);
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(
        `✅ Backend server successfully running on http://0.0.0.0:${PORT}`,
      );
    });
  } catch (err: any) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error(
      "Please verify that your database is running and the URI is correct.",
    );
    process.exit(1);
  }
};

startServer();

export default app;
