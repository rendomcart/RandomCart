import { useState } from 'react';
import * as reviewApi from '../../api/review.api';
import * as userApi from '../../api/user.api';

const ReviewModal = ({ isOpen, onClose, orderId, productId, existingReview, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState(existingReview?.images || []);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      alert('You can only upload up to 3 images per review.');
      return;
    }

    setLoading(true);
    const newImages = [...images];
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await userApi.uploadImage(formData);
        if (data.success) {
          newImages.push({ url: data.data, public_id: 'local' });
        }
      }
      setImages(newImages);
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setLoading(true);
    const payload = { rating, title, comment, images, orderId };

    try {
      if (existingReview) {
        await reviewApi.updateReview(existingReview._id, payload);
      } else {
        await reviewApi.createReview(productId, payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{existingReview ? 'Edit Review' : 'Write a Review'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex-grow">
          {/* Star Rating */}
          <div className="mb-6 flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`text-4xl focus:outline-none transition-colors ${
                    star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add a written review *</label>
              <textarea 
                required
                rows="4" 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="What did you like or dislike? What did you use this product for?"
                className="w-full border border-gray-300 rounded p-2 focus:ring-accent focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add a photo (up to 3)</label>
              
              <div className="flex flex-wrap gap-3 items-center">
                {images.length < 3 && (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-gray-300 border-dashed rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors flex-shrink-0">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-2xl text-gray-400 leading-none mb-1">+</span>
                      <p className="text-[10px] text-gray-500 font-medium">Upload</p>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={loading} />
                  </label>
                )}
                
                {images.length > 0 && images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 border rounded overflow-hidden flex-shrink-0">
                    <img src={img.url.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL.replace('/api', '')}${img.url}`} alt="" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white w-5 h-5 flex items-center justify-center text-xs font-bold rounded-bl transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-accent text-white rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
