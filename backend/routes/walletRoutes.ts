import express from 'express';
import { getHistory, deposit, withdraw, createTransaction } from '../controllers/WalletController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/history', auth, getHistory);
router.post('/deposit', auth, deposit);
router.post('/withdraw', auth, withdraw);
router.post('/transactions', auth, createTransaction);

export default router;
