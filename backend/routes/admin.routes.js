import express from 'express';
import { getCustomers, getCustomerById } from '../controllers/admin.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect, admin);

router.route('/customers')
  .get(getCustomers);

router.route('/customers/:id')
  .get(getCustomerById);

export default router;
