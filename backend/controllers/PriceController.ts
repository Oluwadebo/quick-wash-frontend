import { Request, Response } from "express";
import VendorPriceList from "../models/VendorPriceList.js";

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

    if (!items || !Array.isArray(items)) {
      return res
        .status(400)
        .json({ message: "Invalid items format. Expected an array." });
    }

    const updated = await VendorPriceList.findOneAndUpdate(
      { vendorUid },
      { items, updatedAt: new Date() },
      { upsert: true, new: true, runValidators: true },
    );
    res.json(updated);
  } catch (error: any) {
    console.error("Price Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};
