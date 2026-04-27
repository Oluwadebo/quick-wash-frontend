import express from 'express';
import { getPrices, updatePrices } from '../controllers/PriceController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:vendorUid', getPrices);
router.post('/:vendorUid', auth, updatePrices);

export default router;
