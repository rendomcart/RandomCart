import axios from './axios';

export const getCart = () => axios.get('/cart');
export const addToCart = (data) => axios.post('/cart/add', data);
export const updateCartItem = (data) => axios.put('/cart/update', data);
export const removeFromCart = (data) => axios.delete('/cart/remove', { data });
export const clearCart = () => axios.delete('/cart/clear');
