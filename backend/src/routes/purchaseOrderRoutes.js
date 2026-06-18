import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from '../controllers/purchaseOrderController.js';

const router = express.Router();

router.route('/').get(protect, getPurchaseOrders).post(protect, createPurchaseOrder);
router
  .route('/:id')
  .get(protect, getPurchaseOrderById)
  .put(protect, updatePurchaseOrder)
  .delete(protect, deletePurchaseOrder);

export default router;
