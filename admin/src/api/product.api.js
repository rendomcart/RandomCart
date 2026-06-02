import axios from './axios';

export const getProducts = () => axios.get('/products/admin/all');
export const getProductById = (id) => axios.get(`/products/id/${id}`);
export const getLowStockProducts = () => axios.get('/products/inventory/low');
export const createProduct = (data) => axios.post('/products', data);
export const updateProduct = (id, data) => axios.put(`/products/${id}`, data);
export const deleteProduct = (id) => axios.delete(`/products/${id}`);
