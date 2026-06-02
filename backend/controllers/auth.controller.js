import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import OTP from '../models/OTP.model.js';
import { generateTokens, clearTokens } from '../utils/generateToken.js';
import { generateOTP } from '../utils/generateOTP.js';
import sendEmail from '../utils/sendEmail.js';
import { verifyEmailTemplate, resetPasswordTemplate, welcomeTemplate } from '../utils/emailTemplates.js';
import { sendNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, password, phone } = req.body;
    const email = req.body.email.toLowerCase().trim();

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      isVerified: false,
    });

    const otpCode = generateOTP();
    const otpSalt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, otpSalt);

    await OTP.create({
      email,
      otp: hashedOtp,
      purpose: 'verify',
    });

    try {
      await sendEmail({
        to: email,
        subject: 'RandomCart - Verify your email',
        html: verifyEmailTemplate(otpCode),
      });

      // Notify Admin of new registration
      await sendNotification({
        role: 'admin',
        title: 'New User Registered',
        message: `${user.name} (${user.email}) has just registered.`,
        type: 'ACCOUNT',
        relatedEntityId: user._id
      });

      try {
        const io = getIO();
        if (io) {
          io.to('admin-room').emit('user_registered', {
            id: user._id,
            name: user.name,
            email: user.email
          });
        }
      } catch(err) {}

      res.status(201).json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
      await User.deleteOne({ email });
      await OTP.deleteMany({ email });
      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = req.body.email.toLowerCase().trim();

    const otpRecord = await OTP.findOne({ email, purpose: 'verify' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('OTP has expired or is invalid. Please try registering again.');
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      res.status(400);
      throw new Error('Invalid OTP');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.isVerified = true;
    await user.save();
    await OTP.deleteMany({ email });

    // Notify User of successful verification
    await sendNotification({
      role: 'user',
      user: user._id,
      title: 'Email Verified',
      message: 'Your email has been successfully verified. Welcome to the platform!',
      type: 'ACCOUNT'
    });

    // Send Welcome Email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to RandomCart! 🎉',
        html: welcomeTemplate(user.name),
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    const { accessToken, refreshToken } = generateTokens(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verify OTP
// @route   POST /api/auth/resend-verify-otp
// @access  Public
export const resendVerifyOTP = async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('This email is already verified');
    }

    await OTP.deleteMany({ email, purpose: 'verify' });

    const otpCode = generateOTP();
    const otpSalt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, otpSalt);

    await OTP.create({
      email,
      otp: hashedOtp,
      purpose: 'verify',
    });

    try {
      await sendEmail({
        to: email,
        subject: 'RandomCart - Verify your email',
        html: verifyEmailTemplate(otpCode),
      });

      res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
      await OTP.deleteMany({ email, purpose: 'verify' });
      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { password, appType } = req.body;
    const email = req.body.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
      // Resend OTP logic could go here or be a separate endpoint, keeping it simple for now
      res.status(401);
      throw new Error('Please verify your email first');
    }

    if (appType === 'admin' && user.role !== 'admin') {
      res.status(403);
      throw new Error('Access denied. Admin privileges required.');
    }
    
    if (appType === 'user' && user.role === 'admin') {
      res.status(403);
      throw new Error('Access denied. Admins cannot log into the user app.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const { accessToken, refreshToken } = generateTokens(res, user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res, next) => {
  try {
    clearTokens(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401);
      throw new Error('No refresh token, please login');
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_do_not_use';
    const decoded = jwt.verify(token, refreshSecret);
    
    // Generate only new access token
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_do_not_use_in_prod';
    const accessToken = jwt.sign({ id: decoded.id }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    // Clear the invalid cookies so the browser doesn't get stuck in a bad state
    clearTokens(res);
    res.status(401);
    next(new Error('Refresh token failed'));
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const otpCode = generateOTP();
    const otpSalt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, otpSalt);

    await OTP.deleteMany({ email, purpose: 'reset' });
    await OTP.create({
      email,
      otp: hashedOtp,
      purpose: 'reset',
    });

    try {
      await sendEmail({
        to: email,
        subject: 'RandomCart - Password Reset Request',
        html: resetPasswordTemplate(otpCode),
      });
      res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = req.body.email.toLowerCase().trim();

    const otpRecord = await OTP.findOne({ email, purpose: 'reset' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      res.status(400);
      throw new Error('Invalid OTP');
    }

    // Generate a short-lived reset token (not a full JWT for auth)
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_do_not_use_in_prod';
    const resetToken = jwt.sign({ email }, secret, { expiresIn: '15m' });
    await OTP.deleteMany({ email, purpose: 'reset' });

    res.status(200).json({ success: true, data: { resetToken } });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken) {
      res.status(400);
      throw new Error('Reset token is required');
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_do_not_use_in_prod';
    const decoded = jwt.verify(resetToken, secret);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(400);
    next(new Error('Invalid or expired reset token'));
  }
};
