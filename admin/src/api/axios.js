import axios from 'axios';
import { toast } from 'react-hot-toast';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Response interceptor for handling token refresh
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401
    if (error.response?.status === 401) {
      if (!originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh-token') {
        originalRequest._retry = true;
        try {
          await instance.post('/auth/refresh-token');
          return instance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('userInfo');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else if (originalRequest.url !== '/auth/login') {
        localStorage.removeItem('userInfo');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Global Error Toast Notification
    if (error.response?.data?.message) {
      const msg = error.response.data.message;
      if (error.response.status !== 401 || window.location.pathname !== '/login') {
        toast.error(msg, { id: msg });
      }
    } else if (error.message && error.response?.status !== 401) {
      toast.error(error.message, { id: error.message });
    }

    return Promise.reject(error);
  }
);

export default instance;
