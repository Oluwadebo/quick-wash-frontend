import express from 'express';
import {
  updateOrderStatus,
  getOrders,
  createOrder,
  getOrderById,
  claimOrder,
  rateOrder,
  returnOrder,
  submitDispute,
  autoCancelOrders
} from '../controllers/OrderController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getOrders);
router.post('/', auth, checkRole(['customer']), createOrder);
router.get('/:id', auth, getOrderById);
router.patch('/:id/status', auth, updateOrderStatus);
router.post('/:id/claim', auth, claimOrder);
router.post('/:id/return', auth, returnOrder);
router.post('/:id/rate', auth, rateOrder);
router.post('/dispute', auth, submitDispute);
router.post('/auto-cancel', autoCancelOrders);

export default router;
