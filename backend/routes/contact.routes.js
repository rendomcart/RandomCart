import express from 'express';
import { submitContactMessage, getContactMessages } from '../controllers/contact.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
  .post(submitContactMessage)
  .get(protect, admin, getContactMessages);

export default router;
