import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '../controllers/notification.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.route('/')
  .get(getNotifications);

router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);

router.route('/:id/read')
  .put(markAsRead);

router.route('/:id')
  .delete(deleteNotification);

export default router;
