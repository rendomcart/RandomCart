import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import { sendNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (Name, Avatar, Phone)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    
    // Handle local uploaded string paths or objects
    if (req.body.avatar) {
       if (typeof req.body.avatar === 'string') {
         user.avatar = { url: req.body.avatar, public_id: 'local' };
       } else {
         user.avatar = req.body.avatar;
       }
    }

    const updatedUser = await user.save();

    await sendNotification({
      role: 'user',
      user: user._id,
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      type: 'ACCOUNT'
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${user._id}`).emit('profile_updated', updatedUser);
        io.to('admin-room').emit('profile_updated', updatedUser);
      }
    } catch(err) {}
    
    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar?.url || updatedUser.avatar,
        role: updatedUser.role
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/users/password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const { oldPassword, newPassword } = req.body;

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400);
      throw new Error('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await sendNotification({
      role: 'user',
      user: user._id,
      title: 'Password Changed',
      message: 'Your account password has been changed successfully. If this wasn\'t you, please contact support immediately.',
      type: 'ACCOUNT'
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { fullName, address, city, state, postalCode, phone, country, isDefault } = req.body;
    
    const newAddress = {
      fullName, address, city, state, postalCode, phone, country: country || 'India', isDefault: isDefault || false
    };

    if (isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }

    // If it's the first address, make it default automatically
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${user._id}`).emit('address_updated', user.addresses);
      }
    } catch(err) {}

    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an address
// @route   PUT /api/users/addresses/:id
// @access  Private
export const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    const { fullName, address: street, city, state, postalCode, phone, country, isDefault } = req.body;

    address.fullName = fullName || address.fullName;
    address.address = street || address.address;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.phone = phone || address.phone;
    address.country = country || address.country;

    if (isDefault !== undefined) {
      if (isDefault === true) {
        user.addresses.forEach(a => a.isDefault = false);
        address.isDefault = true;
      }
    }

    await user.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${user._id}`).emit('address_updated', user.addresses);
      }
    } catch(err) {}

    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:id
// @access  Private
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    user.addresses.pull(req.params.id);
    
    // If we deleted the default address, make the first remaining address the default
    if (address.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`user-${user._id}`).emit('address_updated', user.addresses);
      }
    } catch(err) {}

    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};
