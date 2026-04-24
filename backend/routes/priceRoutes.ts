import express from 'express';
import { getPrices, updatePrices } from '../controllers/PriceController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/:vendorUid', getPrices);
router.post('/:vendorUid', auth, updatePrices);

export default router;
