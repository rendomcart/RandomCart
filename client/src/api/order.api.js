import axios from './axios';

export const createOrder = (data) => axios.post('/orders', data);
export const getMyOrders = () => axios.get('/orders/myorders');
export const getOrderById = (id) => axios.get(`/orders/${id}`);

// Download PDF Invoice
export const downloadInvoice = (id) => axios.get(`/orders/${id}/invoice`, {
  responseType: 'blob' // Important for handling binary file data
});
