import axios from './axios';

export const createRazorpayOrder = (data) => axios.post('/payment/create-order', data);
export const verifyRazorpayPayment = (data) => axios.post('/payment/verify', data);
export const getRazorpayKey = () => axios.get('/payment/key');
