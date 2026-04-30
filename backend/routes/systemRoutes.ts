import express from "express";
import SiteSetting from "../models/SiteSetting";
import User from "../models/User";
import Order from "../models/Order";
import ContactSubmission from "../models/ContactSubmission";
import Campaign from "../models/Campaign";
import AuditLog from "../models/AuditLog";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      orders,
      users
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.find({}).sort({ createdAt: -1 }),
      User.find({})
    ]);

    const completed = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
    const revenue = completed.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    const active = orders.filter(o => !['completed', 'cancelled', 'delivered'].includes(o.status.toLowerCase()));

    // Hourly velocity logic
    const now = new Date();
    const hourlyVelocity = Array.from({ length: 12 }, (_, i) => {
      const h = new Date(now.getTime() - (11 - i) * 60 * 60 * 1000);
      const hStr = h.getHours() + ':00';
      const count = orders.filter(o => new Date(o.createdAt).getHours() === h.getHours()).length;
      return { time: hStr, orders: count };
    });

    res.json({
      totalUsers,
      totalOrders,
      totalRevenue: revenue,
      activeOrders: active.length,
      hourlyVelocity,
      userTypeDist: [
        { name: 'Customer', value: users.filter(u => u.role === 'customer').length },
        { name: 'Vendor', value: users.filter(u => u.role === 'vendor').length },
        { name: 'Rider', value: users.filter(u => u.role === 'rider').length },
      ],
      // Migration of the previous dummy stats just in case something uses them
      customers: users.filter(u => u.role === 'customer').length,
      vendors: users.filter(u => u.role === 'vendor').length,
      riders: users.filter(u => u.role === 'rider').length,
      completedOrders: completed.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/contact", async (req, res) => {
  try {
    const submission = await ContactSubmission.create(req.body);
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/settings", async (req, res) => {
  try {
    let settings = await SiteSetting.findOne({ id: 'global' });
    if (!settings) settings = await SiteSetting.create({ id: 'global' });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const settings = await SiteSetting.findOneAndUpdate(
      { id: 'global' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Campaigns ---
router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/campaigns", async (req, res) => {
  try {
    const { name, status, reach, conversion, color } = req.body;
    const campaign = await Campaign.create({
      id: Date.now(),
      name,
      status,
      reach,
      conversion,
      color
    });
    res.json(campaign);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/campaigns/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.json(campaign);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/campaigns/:id", async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Campaign deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// --- Audit Logs ---
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ time: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/audit-logs", async (req, res) => {
  try {
    const log = await AuditLog.create({
      ...req.body,
      id: Date.now(),
      time: new Date()
    });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/audit-logs/:id", async (req, res) => {
  try {
    const log = await AuditLog.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
