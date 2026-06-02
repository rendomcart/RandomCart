import axios from './axios';

export const getCategories = () => axios.get('/categories');
export const getCategoryBySlug = (slug) => axios.get(`/categories/${slug}`);
