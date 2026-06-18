import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToInvoice
} from '../controllers/quotationController.js';

const router = express.Router();

router.route('/')
  .get(protect, getQuotations)
  .post(protect, createQuotation);

router.route('/:id')
  .get(protect, getQuotationById)
  .put(protect, updateQuotation)
  .delete(protect, deleteQuotation);

router.route('/:id/convert')
  .post(protect, convertQuotationToInvoice);

export default router;
