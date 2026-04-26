import express from "express";
import SiteSetting from "../models/SiteSetting";

const router = express.Router();

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
