import axios from './axios';

export const getAllReviews = () => axios.get('/reviews/admin/all');
export const deleteReview = (id) => axios.delete(`/reviews/${id}`);
