import axios from './axios';

export const login = (credentials) => axios.post('/auth/login', credentials);
export const logout = () => axios.post('/auth/logout');
export const getMe = () => axios.get('/auth/me');
export const forgotPassword = (data) => axios.post('/auth/forgot-password', data);
export const verifyResetOTP = (data) => axios.post('/auth/verify-reset-otp', data);
export const resetPassword = (data) => axios.post('/auth/reset-password', data);

export const updateProfile = (data) => axios.put('/users/profile', data);
export const updatePassword = (data) => axios.put('/users/password', data);
export const uploadImage = (formData) => axios.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
