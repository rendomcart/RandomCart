import axios from './axios';

export const getWishlist = () => axios.get('/wishlist');
export const addToWishlist = (data) => axios.post('/wishlist/add', data);
export const removeFromWishlist = (productId) => axios.delete(`/wishlist/remove/${productId}`);
