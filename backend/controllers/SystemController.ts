import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SiteSettings from '../models/SiteSettings.js';
import ContactSubmission from '../models/ContactSubmission.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const { action, admin, adminUid, target, details } = req.body;
    const log = await AuditLog.create({ action, admin, adminUid, target, details });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSiteSettings = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected. Please check your MONGODB_URI.' });
    }
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ name: 'Quick-Wash' });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSiteSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    let settings = await SiteSettings.findOneAndUpdate({}, updates, { new: true, upsert: true });
    res.json(settings);
  } catch (error: any) {
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
      return res.status(503).json({ message: 'Database not connected. Please check your MONGODB_URI.' });
    }
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
      customers: userCount, 
      vendors: vendorCount,
      riders: riderCount,
      completedOrders: orderCount,
      featured: topVendors,
      metrics: {
        avgDelivery: 18,
        totalVolume: Math.round(orderCount * 5.2),
        uptime: '99.9%'
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
