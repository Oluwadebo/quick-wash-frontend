import express from 'express';
import { getSiteSettings, updateSiteSettings, submitContactForm, getStats, getAuditLogs, createAuditLog } from '../controllers/SystemController.js';
import { auth, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/settings', getSiteSettings);
router.patch('/settings', auth, checkRole(['admin']), updateSiteSettings);
router.post('/contact', submitContactForm);
router.get('/stats', getStats);
router.get('/audit', auth, checkRole(['admin']), getAuditLogs);
router.post('/audit', auth, checkRole(['admin']), createAuditLog);

export default router;
