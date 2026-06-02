import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as reviewApi from '../api/review.api';
import ReviewModal from '../components/product/ReviewModal';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = async () => {
    try {
      const { data } = await reviewApi.getMyReviews();
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
  }, []);

  const handleEdit = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const executeDelete = async (id) => {
    try {
      await reviewApi.deleteReview(id);
      setReviews(reviews.filter(r => r._id !== id));
      toast.success('Review deleted successfully');
      setConfirmModal({ isOpen: false, id: null });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete review');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your reviews...</div>;

  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-1/4">
        <div className="bg-white p-4 rounded shadow-sm border">
          <ul className="space-y-2">
            <li><Link to="/profile" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Profile</Link></li>
            <li><Link to="/addresses" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Addresses</Link></li>
            <li><Link to="/orders" className="block p-2 hover:bg-gray-50 rounded text-gray-700">Orders</Link></li>
            <li><Link to="/my-reviews" className="block p-2 bg-gray-100 font-medium text-primary rounded">My Reviews</Link></li>
          </ul>
        </div>
      </div>

      <div className="w-full md:w-3/4">
        <h1 className="text-2xl font-bold text-text-main mb-6">My Reviews</h1>
        
        {reviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded shadow-sm border">
            <h2 className="text-xl font-bold mb-2">No Reviews Yet</h2>
            <p className="text-gray-500">You haven't written any product reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review._id} className="bg-white border rounded shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Product Info */}
                  <div className="w-full md:w-1/4 flex-shrink-0">
                    <Link to={`/products/${review.product?._id}`}>
                      <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-2 border">
                        {review.product?.variants?.[0]?.images?.[0] ? (
                          <img src={formatImgUrl(review.product.variants[0].images[0].url)} alt={review.product.name} className="w-full h-full object-contain p-2 bg-white" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-accent hover:underline line-clamp-2">{review.product?.name}</p>
                    </Link>
                  </div>
                  
                  {/* Review Info */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-yellow-500 text-sm">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          {review.title && <span className="font-bold text-gray-800">{review.title}</span>}
                        </div>
                        <p className="text-xs text-gray-500">Reviewed on {new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(review)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</button>
                        <button onClick={() => handleDelete(review._id)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4">{review.comment}</p>
                    
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2">
                        {review.images.map((img, idx) => (
                          <div key={idx} className="w-16 h-16 border rounded overflow-hidden">
                            <img src={formatImgUrl(img.url)} alt={`Review upload ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ReviewModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReview(null);
          }}
          existingReview={selectedReview}
          onSuccess={fetchReviews}
        />
      )}
    </div>
  );
};

export default MyReviewsPage;
