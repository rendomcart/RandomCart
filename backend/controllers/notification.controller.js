import Notification from '../models/Notification.model.js';
import { getIO } from '../config/socket.js';

// @desc    Get all notifications for user or admin
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const role = req.user.role; // 'user' or 'admin'
    const query = role === 'admin' ? { role: 'admin' } : { role: 'user', user: req.user._id };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.role === 'user' && notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (notification.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, data: notification });
    
    try {
      const io = getIO();
      if (io) {
        if (notification.role === 'admin') {
          io.to('admin-room').emit('notification_read', notification._id);
        } else {
          io.to(`user-${notification.user}`).emit('notification_read', notification._id);
        }
      }
    } catch(err) {}
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const role = req.user.role;
    const query = role === 'admin' ? { role: 'admin' } : { role: 'user', user: req.user._id };

    await Notification.updateMany(query, { isRead: true });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });

    try {
      const io = getIO();
      if (io) {
        if (role === 'admin') {
          io.to('admin-room').emit('notification_read_all');
        } else {
          io.to(`user-${req.user._id}`).emit('notification_read_all');
        }
      }
    } catch(err) {}
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.role === 'user' && notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (notification.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await notification.deleteOne();

    res.status(200).json({ success: true, message: 'Notification deleted' });

    try {
      const io = getIO();
      if (io) {
        if (notification.role === 'admin') {
          io.to('admin-room').emit('notification_deleted', notification._id);
        } else {
          io.to(`user-${notification.user}`).emit('notification_deleted', notification._id);
        }
      }
    } catch(err) {}
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
export const clearAllNotifications = async (req, res, next) => {
  try {
    const role = req.user.role;
    const query = role === 'admin' ? { role: 'admin' } : { role: 'user', user: req.user._id };

    await Notification.deleteMany(query);

    res.status(200).json({ success: true, message: 'All notifications cleared' });

    try {
      const io = getIO();
      if (io) {
        if (role === 'admin') {
          io.to('admin-room').emit('notification_cleared_all');
        } else {
          io.to(`user-${req.user._id}`).emit('notification_cleared_all');
        }
      }
    } catch(err) {}
  } catch (error) {
    next(error);
  }
};
