import axios from './axios';

export const register = (userData) => axios.post('/auth/register', userData);
export const verifyEmail = (data) => axios.post('/auth/verify-email', data);
export const resendVerifyOTP = (data) => axios.post('/auth/resend-verify-otp', data);
export const login = (credentials) => axios.post('/auth/login', credentials);
export const logout = () => axios.post('/auth/logout');
export const getMe = () => axios.get('/auth/me');
export const forgotPassword = (data) => axios.post('/auth/forgot-password', data);
export const verifyResetOTP = (data) => axios.post('/auth/verify-reset-otp', data);
export const resetPassword = (data) => axios.post('/auth/reset-password', data);
