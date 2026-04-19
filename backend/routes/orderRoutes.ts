import express from 'express';
import { updateOrderStatus, getOrders, createOrder } from '../controllers/OrderController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getOrders);
router.post('/', auth, checkRole(['customer']), createOrder);
router.patch('/:id/status', auth, updateOrderStatus);

export default router;
