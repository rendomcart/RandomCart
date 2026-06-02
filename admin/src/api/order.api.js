import axios from './axios';

export const getOrders = () => axios.get('/orders');
export const getOrderById = (id) => axios.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => axios.put(`/orders/${id}/status`, data);
