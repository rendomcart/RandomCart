import axios from './axios';

export const getCustomers = () => axios.get('/admin/customers');
export const getCustomerById = (id) => axios.get(`/admin/customers/${id}`);

export const downloadInvoice = (id) => axios.get(`/orders/${id}/invoice`, { responseType: 'text' });
export const regenerateInvoice = (id) => axios.post(`/orders/${id}/invoice/regenerate`);
export const rejectOrder = (id, rejectionReason) => axios.put(`/orders/${id}/reject`, { rejectionReason });
