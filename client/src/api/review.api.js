import axios from './axios';

export const getProductReviews = (productId) => axios.get(`/reviews/${productId}`);
export const createReview = (productId, data) => axios.post(`/reviews/${productId}`, data);
export const deleteReview = (id) => axios.delete(`/reviews/${id}`);
export const updateReview = (id, data) => axios.put(`/reviews/${id}`, data);
export const getMyReviews = () => axios.get(`/reviews/my-reviews`);
export const getAdminReviews = () => axios.get(`/reviews/admin/all`);
