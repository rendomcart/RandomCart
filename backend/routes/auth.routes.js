import express from 'express';
import {
  registerUser,
  verifyEmail,
  resendVerifyOTP,
  loginUser,
  logoutUser,
  refreshToken,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verify-otp', resendVerifyOTP);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

export default router;
