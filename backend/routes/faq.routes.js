import express from 'express';
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ
} from '../controllers/faq.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getFAQs)
  .post(protect, admin, createFAQ);

router.route('/:id')
  .put(protect, admin, updateFAQ)
  .delete(protect, admin, deleteFAQ);

export default router;
