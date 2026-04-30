import express from 'express';
import Draft from '../models/Draft';
const router = express.Router();

// Get user drafts
router.get('/:userId', async (req, res) => {
  try {
    const drafts = await Draft.find({ userId: req.params.userId });
    res.json(drafts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Save/Update draft
router.post('/', async (req, res) => {
  try {
    const { userId, vendorId, items } = req.body;
    const draft = await Draft.findOneAndUpdate(
      { userId, vendorId },
      { items, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(draft);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete draft
router.delete('/:userId/:vendorId', async (req, res) => {
  try {
    await Draft.findOneAndDelete({ userId: req.params.userId, vendorId: req.params.vendorId });
    res.json({ message: 'Draft deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
