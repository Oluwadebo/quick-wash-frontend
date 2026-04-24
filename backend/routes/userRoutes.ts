import express from 'express';
import { 
  signup, 
  login, 
  getUserProfile, 
  updateProfile, 
  getAllUsers, 
  getUserById,
  updateUserById,
  deleteUser,
  approveUser,
  processRecovery,
  adjustTrust,
  autoRecoverTrust,
  recordTransaction,
  updateUserByUid,
  getVendors
} from '../controllers/UserController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', auth, getUserProfile);
router.patch('/profile', auth, updateProfile);
router.get('/vendors', auth, getVendors);

// Admin routes
router.get('/', auth, checkRole(['admin']), getAllUsers);
router.get('/:uid', auth, getUserById); // All authenticated users can at least see profiles (filtered in controller)
router.patch('/:uid', auth, checkRole(['admin']), updateUserById);
router.delete('/:uid', auth, checkRole(['admin']), deleteUser);
router.patch('/:uid/approve', auth, checkRole(['admin']), approveUser);
router.post('/:uid/recovery', auth, processRecovery);
router.post('/:uid/trust', auth, checkRole(['admin']), adjustTrust);
router.post('/:uid/auto-recover', auth, autoRecoverTrust);
router.post('/:uid/transactions', auth, checkRole(['admin']), recordTransaction);
router.patch('/:uid/advanced', auth, checkRole(['admin']), updateUserByUid);

export default router;
