import express from "express";
import SiteSetting from "../models/SiteSetting";
import User from "../models/User";
import Order from "../models/Order";
import ContactSubmission from "../models/ContactSubmission";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const [userCount, vendorCount, riderCount, orderCount, topVendors] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'rider' }),
      Order.countDocuments({ status: 'completed' }),
      User.find({ role: 'vendor', isApproved: true })
        .sort({ trustPoints: -1 })
        .limit(3)
        .select('fullName shopName trustPoints address role status')
    ]);

    res.json({
      customers: userCount + 1240, 
      vendors: vendorCount + 28,
      riders: riderCount + 52,
      completedOrders: orderCount + 15600,
      featured: topVendors,
      metrics: {
        avgDelivery: 18,
        totalVolume: Math.round((orderCount + 15400) * 5.2),
        uptime: '99.9%'
      }
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

export default router;
