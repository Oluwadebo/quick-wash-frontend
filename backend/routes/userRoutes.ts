import express from 'express';
import { getVendors, getUserProfile, getVendorPriceList } from '../controllers/UserController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public route to list vendors for customers
router.get('/vendors', getVendors);
router.get('/vendors/:vendorUid/prices', getVendorPriceList);

// Auth required for specific profile access
router.get('/profile/:uid', auth, getUserProfile);

export default router;
