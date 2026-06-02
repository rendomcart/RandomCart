import axios from './axios';

export const getNotifications = () => axios.get('/notifications');
export const markAsRead = (id) => axios.put(`/notifications/${id}/read`);
export const markAllAsRead = () => axios.put('/notifications/read-all');
export const deleteNotification = (id) => axios.delete(`/notifications/${id}`);
export const clearAllNotifications = () => axios.delete('/notifications/clear-all');
