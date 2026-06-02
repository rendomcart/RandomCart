import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null implies it's an admin notification
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
    // Examples: 'ORDER_PLACED', 'SYSTEM', 'ACCOUNT', 'STOCK_ALERT'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
