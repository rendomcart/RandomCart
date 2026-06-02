import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  rejectOrder,
  downloadInvoice,
  regenerateInvoice
} from '../controllers/order.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id').get(protect, getOrderById);

router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/reject').put(protect, admin, rejectOrder);

// Invoice routes
router.route('/:id/invoice')
  .get(protect, downloadInvoice);

router.route('/:id/invoice/regenerate')
  .post(protect, admin, regenerateInvoice);

export default router;
