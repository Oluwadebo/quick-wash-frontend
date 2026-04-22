import { Request, Response } from 'express';
import VendorPriceList from '../models/VendorPriceList.js';

export const getPrices = async (req: Request, res: Response) => {
  try {
    const { vendorUid } = req.params;
    const priceList = await VendorPriceList.findOne({ vendorUid });
    res.json(priceList?.items || []);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePrices = async (req: Request, res: Response) => {
  try {
    const { vendorUid } = req.params;
    const { items } = req.body;

    const updated = await VendorPriceList.findOneAndUpdate(
      { vendorUid },
      { items },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
