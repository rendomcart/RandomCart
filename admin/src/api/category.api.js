import axios from './axios';

export const getCategories = () => axios.get('/categories/admin/all');
export const createCategory = (data) => axios.post('/categories', data);
export const updateCategory = (id, data) => axios.put(`/categories/${id}`, data);
export const deleteCategory = (id) => axios.delete(`/categories/${id}`);
