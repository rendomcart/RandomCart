import Review from '../models/Review.model.js';
import Order from '../models/Order.model.js';
import Product from '../models/Product.model.js';
import { sendNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

// Helper function to update product ratings
const updateProductRatings = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const count = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((acc, item) => acc + item.rating, 0) / count;
  
  await Product.findByIdAndUpdate(productId, {
    'ratings.count': count,
    'ratings.average': Number(average.toFixed(1))
  });
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort('-createdAt');
      
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new review
// @route   POST /api/reviews/:productId
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { rating, title, comment, images, orderId } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    if (!orderId) {
      res.status(400);
      throw new Error('Order ID is required to submit a review');
    }

    if (images && images.length > 3) {
      res.status(400);
      throw new Error('Maximum 3 images allowed per review');
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.orderStatus !== 'Delivered') {
      res.status(403);
      throw new Error('You can only review products from delivered orders');
    }

    const itemExists = order.orderItems.find(item => item.product.toString() === productId);
    if (!itemExists) {
      res.status(403);
      throw new Error('Product not found in this order');
    }

    const alreadyReviewed = await Review.findOne({ product: productId, orderId: orderId });
    if (alreadyReviewed) {
      res.status(400);
      throw new Error('You have already reviewed this product for this specific order');
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      orderId,
      title,
      rating: Number(rating),
      comment,
      images: images || []
    });

    await updateProductRatings(productId);

    const product = await Product.findById(productId);
    await sendNotification({
      role: 'admin',
      title: 'New Product Review',
      message: `${req.user.name} submitted a ${rating}-star review for "${product.name}".`,
      type: 'REVIEW',
      relatedEntityId: review._id
    });

    try {
      const io = getIO();
      if (io) {
        io.emit('review_created', review);
        io.to('admin-room').emit('review_received', review);
      }
    } catch(err) {}

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment, images } = req.body;
    
    if (images && images.length > 3) {
      res.status(400);
      throw new Error('Maximum 3 images allowed per review');
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    if (review.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this review');
    }

    review.rating = rating || review.rating;
    if (title !== undefined) review.title = title;
    review.comment = comment || review.comment;
    if (images) review.images = images;

    await review.save();
    await updateProductRatings(review.product);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_updated', review);
        io.to('admin-room').emit('review_updated', review);
      }
    } catch(err) {}

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .populate('orderId', 'createdAt orderStatus')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for admin
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name email avatar')
      .populate('product', 'name images')
      .populate('orderId', '_id createdAt')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this review');
    }

    const productId = review.product;
    await review.deleteOne(); // Mongoose 6+ approach
    await updateProductRatings(productId);

    try {
      const io = getIO();
      if (io) {
        io.emit('review_deleted', req.params.id);
        io.to('admin-room').emit('review_deleted', req.params.id);
      }
    } catch(err) {}

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
