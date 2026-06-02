import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey
} from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/verify').post(protect, verifyRazorpayPayment);
router.route('/key').get(protect, getRazorpayKey);

export default router;
