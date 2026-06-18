import express from 'express';
import { exportData, importData } from '../controllers/backupController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/export', protect, exportData);
router.post('/import', protect, importData);

export default router;
