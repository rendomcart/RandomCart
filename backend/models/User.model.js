import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 8,
    select: false,
  },
  phone: {
    type: String,
  },
  avatar: {
    url: String,
    public_id: String,
  },
  addresses: [
    {
      fullName: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      phone: String,
      country: { type: String, default: 'India' },
      isDefault: { type: Boolean, default: false },
    }
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, {
  timestamps: true,
});

// The pre-save hook has been removed per user request. 
// Password hashing is now handled directly in the controllers.

// The comparePassword method has been removed per user request.
// Password comparison is now handled directly via bcrypt.compare in controllers.

const User = mongoose.model('User', userSchema);
export default User;
