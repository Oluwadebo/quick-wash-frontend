import { Request, Response } from "express";
import mongoose from "mongoose";
import ContactSubmission from "../models/ContactSubmission.js";
import Order from "../models/Order.js";
import SiteSettings from "../models/SiteSettings.js";
import User from "../models/User.js";

export const getSiteSettings = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected. Please check your MONGODB_URI.",
      });
    }
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({id: 'global',
        name: "Quick-Wash",
        serviceFee: 0,
        commissionRate: 20,
      });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSiteSettings = async (req: Request, res: Response) => {
  try {
    // const updates = req.body;
    const settings = await SiteSettings.findOneAndUpdate(
      { id: 'global' },
      { $set: req.body },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );
    res.json(settings);
  } catch (error: any) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;
    const submission = await ContactSubmission.create({ name, email, message });
    res.status(201).json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected. Please check your MONGODB_URI.",
      });
    }
    const [userCount, vendorCount, riderCount, orderCount, topVendors] =
      await Promise.all([
        User.countDocuments({ role: "customer" }),
        User.countDocuments({ role: "vendor" }),
        User.countDocuments({ role: "rider" }),
        Order.countDocuments({ status: "completed" }),
        User.find({ role: "vendor", isApproved: true })
          .sort({ trustPoints: -1 })
          .limit(3)
          .select("fullName shopName trustPoints address role status"),
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
        uptime: "99.9%",
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
