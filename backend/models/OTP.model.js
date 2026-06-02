import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['verify', 'reset'],
    required: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    expires: 0 // TTL index
  }
});

// The pre-save hook has been removed per user request. 
// OTP hashing is now handled directly in the controllers.

// The compareOTP method has been removed per user request.
// OTP comparison is now handled directly via bcrypt.compare in controllers.

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
