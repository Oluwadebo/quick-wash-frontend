import express from "express";
import VendorPriceList from "../models/VendorPriceList";

const router = express.Router();

router.get("/:vendorUid", async (req, res) => {
  try {
    const list = await VendorPriceList.findOne({ vendorUid: req.params.vendorUid });
    res.json(list?.prices || []);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:vendorUid", async (req, res) => {
  try {
    const { prices } = req.body;
    const list = await VendorPriceList.findOneAndUpdate(
      { vendorUid: req.params.vendorUid },
      { $set: { prices } },
      { upsert: true, new: true }
    );
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
