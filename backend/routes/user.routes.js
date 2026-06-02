import express from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.put('/password', updatePassword);

router.route('/addresses')
  .post(addAddress);

router.route('/addresses/:id')
  .put(updateAddress)
  .delete(deleteAddress);

export default router;
