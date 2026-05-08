import express from 'express';
import DeliveryZone from '../models/DeliveryZone';

const router = express.Router();

// Get fee between two landmarks
router.get('/fee', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Pickup and dropoff landmarks are required' });
    }

    const zone = await DeliveryZone.findOne({ 
      fromLandmark: from as string, 
      toLandmark: to as string,
      isActive: true
    });

    if (!zone) {
      // Return a default fee or 404
      return res.json({ fee: 1000, isDefault: true }); // Fallback to a default if not found
    }

    res.json({ fee: zone.fee, isDefault: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create or Update Delivery Zone
router.post('/zones', async (req, res) => {
  try {
    const { fromLandmark, toLandmark, fee } = req.body;
    
    const zone = await DeliveryZone.findOneAndUpdate(
      { fromLandmark, toLandmark },
      { fee, isActive: true },
      { upsert: true, new: true }
    );
    
    res.json(zone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all zones
router.get('/zones', async (req, res) => {
  try {
    const zones = await DeliveryZone.find({});
    res.json(zones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
