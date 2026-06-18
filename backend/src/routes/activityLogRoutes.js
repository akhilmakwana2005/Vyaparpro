import express from 'express';
import { getActivityLogs } from '../controllers/activityLogController.js';
import { protect, ownerOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, ownerOnly, getActivityLogs);

export default router;
