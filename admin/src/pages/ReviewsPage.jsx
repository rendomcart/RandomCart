import { useState, useEffect } from 'react';
import * as reviewApi from '../api/review.api';
import { Star, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import ConfirmModal from '../components/ConfirmModal';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const fetchReviews = async () => {
    try {
      const { data } = await reviewApi.getAllReviews();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    if (!socket) return;

    const handleReviewChange = () => fetchReviews();

    socket.on('review_received', handleReviewChange);
    socket.on('review_updated', handleReviewChange);
    socket.on('review_deleted', handleReviewChange);

    return () => {
      socket.off('review_received', handleReviewChange);
      socket.off('review_updated', handleReviewChange);
      socket.off('review_deleted', handleReviewChange);
    };
  }, [socket]);

  const executeDelete = async (id) => {
    try {
      await reviewApi.deleteReview(id);
      setReviews(reviews.filter(r => r._id !== id));
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete review');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading reviews...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Manage Reviews</h1>
      </div>

      <div className="bg-white rounded shadow-sm border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating & Comment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map((review) => (
              <tr key={review._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-200 flex justify-center items-center">
                      {review.user?.avatar?.url ? (
                        <img className="h-10 w-10 object-cover" src={formatImgUrl(review.user.avatar.url)} alt="" />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center font-bold text-gray-500">
                          {review.user?.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{review.user?.name}</div>
                      <div className="text-sm text-gray-500">{review.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      {review.product?.images?.[0] && (
                        <img src={formatImgUrl(review.product.images[0].url)} alt="" className="h-full w-full object-contain" />
                      )}
                    </div>
                    <div className="text-sm text-gray-900 truncate max-w-[150px]" title={review.product?.name}>
                      {review.product?.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-yellow-500 text-sm mb-1">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    {review.title && <span className="ml-2 font-bold text-gray-800 text-xs">{review.title}</span>}
                  </div>
                  <div className="text-sm text-gray-500 line-clamp-2" title={review.comment}>
                    {review.comment}
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {review.images.map((img, i) => (
                        <img key={i} src={formatImgUrl(img.url)} alt="review upload" className="h-8 w-8 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDelete(review._id)} className="text-red-600 hover:text-red-900 flex items-center gap-1 justify-end ml-auto">
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && (
          <div className="text-center py-10 text-gray-500">No reviews found.</div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message="Are you sure you want to permanently delete this review?"
        onConfirm={() => executeDelete(confirmModal.id)}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default ReviewsPage;
