import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { processBillingPrompt } from '../controllers/aiController.js';

const router = express.Router();

router.post('/billing-assist', protect, processBillingPrompt);

export default router;
