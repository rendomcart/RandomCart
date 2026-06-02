import { useState } from 'react';
import * as reviewApi from '../../api/review.api';

const ReviewForm = ({ productId, onReviewAdded }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await reviewApi.createReview(productId, { rating, comment });
      if (data.success) {
        setComment('');
        setRating(5);
        if (onReviewAdded) onReviewAdded(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded border mb-6">
      <h3 className="text-lg font-bold mb-4">Write a Review</h3>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Review Comment</label>
          <textarea
            required
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="What did you like or dislike?"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-6 py-2 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
