import Notification from '../models/Notification.model.js';
import { getIO } from '../config/socket.js';

/**
 * Creates a notification in the database and emits it via socket.io
 * 
 * @param {Object} params
 * @param {String} params.role - 'user' or 'admin'
 * @param {String} params.user - User ObjectId (null if role is admin)
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification body
 * @param {String} params.type - Categorization type (e.g. 'ORDER_PLACED')
 * @param {String} params.relatedEntityId - ObjectId for related order/product (optional)
 */
export const sendNotification = async ({ role, user = null, title, message, type, relatedEntityId = null }) => {
  try {
    // 1. Save to Database
    const notification = await Notification.create({
      role,
      user,
      title,
      message,
      type,
      relatedEntityId
    });

    // 2. Emit via Socket.io
    try {
      const io = getIO();
      if (role === 'admin') {
        io.to('admin-room').emit('receive_notification', notification);
      } else if (role === 'user' && user) {
        io.to(`user-${user}`).emit('receive_notification', notification);
      }
    } catch (socketError) {
      console.log('Socket emission failed, but notification was saved:', socketError.message);
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error.message);
    return null;
  }
};
