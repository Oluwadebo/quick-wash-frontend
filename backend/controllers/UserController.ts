import { Request, Response } from 'express';
import User from '../models/User.js';
import VendorPriceList from '../models/VendorPriceList.js';

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await User.find({ role: 'vendor', isApproved: true });
    res.json(vendors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVendorPriceList = async (req: Request, res: Response) => {
  try {
    const { vendorUid } = req.params;
    const priceList = await VendorPriceList.findOne({ vendorUid });
    res.json(priceList ? priceList.prices : []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
