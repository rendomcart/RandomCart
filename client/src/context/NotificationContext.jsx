import { createContext, useState, useEffect, useContext } from 'react';
import * as notificationApi from '../api/notification.api';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';
import { SocketContext } from './SocketContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    
    const handleReceive = (notification) => {
      fetchNotifications();
      if (notification && notification.title) {
        toast(
          (t) => (
            <div className="cursor-pointer" onClick={() => toast.dismiss(t.id)}>
              <p className="font-bold text-sm mb-1">{notification.title}</p>
              <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
            </div>
          ),
          {
            duration: 5000,
            icon: '🔔',
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e2e8f0',
              padding: '12px 16px',
            },
          }
        );
      }
    };

    const handleUpdate = () => {
      fetchNotifications();
    };

    socket.on('receive_notification', handleReceive);
    socket.on('notification_read', handleUpdate);
    socket.on('notification_read_all', handleUpdate);
    socket.on('notification_deleted', handleUpdate);
    socket.on('notification_cleared_all', handleUpdate);

    return () => {
      socket.off('receive_notification', handleReceive);
      socket.off('notification_read', handleUpdate);
      socket.off('notification_read_all', handleUpdate);
      socket.off('notification_deleted', handleUpdate);
      socket.off('notification_cleared_all', handleUpdate);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationApi.getNotifications();
      if (data.success) {
        setNotifications(data.data);
        const unread = data.data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { data } = await notificationApi.markAsRead(id);
      if (data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data } = await notificationApi.markAllAsRead();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { data } = await notificationApi.deleteNotification(id);
      if (data.success) {
        const notifToDelete = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (notifToDelete && !notifToDelete.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data } = await notificationApi.clearAllNotifications();
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
