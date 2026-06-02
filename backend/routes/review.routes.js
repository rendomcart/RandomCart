import express from 'express';
import { getProductReviews, createReview, deleteReview, updateReview, getMyReviews, getAllReviewsAdmin } from '../controllers/review.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router({ mergeParams: true }); 

router.get('/my-reviews', protect, getMyReviews);
router.get('/admin/all', protect, admin, getAllReviewsAdmin);

router.route('/:productId')
  .get(getProductReviews)
  .post(protect, createReview);

router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

export default router;
