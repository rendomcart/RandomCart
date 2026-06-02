import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: true
  },
  title: {
    type: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  images: [{
    public_id: { type: String },
    url: { type: String }
  }],
}, {
  timestamps: true
});

// Prevent user from submitting more than one review per product per order
reviewSchema.index({ product: 1, orderId: 1 }, { unique: true });

// Static method to get avg rating and save
reviewSchema.statics.getAverageRating = async function (productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      rating: obj[0]?.averageRating || 0,
      numReviews: obj[0]?.numOfReviews || 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after remove
reviewSchema.pre('remove', function () {
  this.constructor.getAverageRating(this.product);
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
