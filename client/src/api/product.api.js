import axios from './axios';

export const getProducts = (params) => axios.get('/products', { params });
export const getProductBySlug = (slug) => axios.get(`/products/${slug}`);
