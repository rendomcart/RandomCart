import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as productApi from '../api/product.api';
import { useSocket } from '../context/SocketContext';
import VariantSelector from '../components/product/VariantSelector';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { AuthContext } from '../context/AuthContext';
import * as reviewApi from '../api/review.api';
import ReviewCard from '../components/product/ReviewCard';
import { Heart, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const fetchProductAndReviews = async () => {
    try {
      const { data: prodData } = await productApi.getProductBySlug(slug);
      if (prodData.success) {
        setProduct(prodData.data);
        if (prodData.data.variants?.length > 0) {
          setSelectedVariant(prodData.data.variants[0]);
        }
        
        const { data: revData } = await reviewApi.getProductReviews(prodData.data._id);
        if (revData.success) {
          setReviews(revData.data);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndReviews();
  }, [slug]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('stock_updated', fetchProductAndReviews);
    socket.on('review_created', fetchProductAndReviews);
    socket.on('review_updated', fetchProductAndReviews);
    socket.on('review_deleted', fetchProductAndReviews);

    return () => {
      socket.off('stock_updated', fetchProductAndReviews);
      socket.off('review_created', fetchProductAndReviews);
      socket.off('review_updated', fetchProductAndReviews);
      socket.off('review_deleted', fetchProductAndReviews);
    };
  }, [socket, slug]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (!product) return <div className="text-center py-20 text-red-500">Product not found</div>;

  // Determine current price and stock to display based on selection
  const currentPrice = selectedVariant?.discountPrice || selectedVariant?.price || 0;
  const originalPrice = selectedVariant?.price || 0;
  const hasDiscount = !!selectedVariant?.discountPrice && selectedVariant.discountPrice < selectedVariant.price;

  const currentStock = selectedVariant?.stock || 0;

  // Compile images based on variant selection
  let rawImages = selectedVariant?.images || [];

  // Remove duplicate images by URL
  const uniqueUrls = new Set();
  const allImages = rawImages.filter(img => {
    if (uniqueUrls.has(img.url)) return false;
    uniqueUrls.add(img.url);
    return true;
  });

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    const res = await addToCart(product._id, selectedVariant?._id || null, quantity);
    if (res.success) {
      toast.success('Added to cart!');
    } else {
      toast.error(res.message);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    
    const buyNowItem = {
      product: product,
      variantId: selectedVariant?._id || null,
      color: selectedVariant?.color || '',
      size: selectedVariant?.size || '',
      image: selectedVariant?.images?.[0]?.url || '',
      quantity: quantity,
      price: selectedVariant.discountPrice || selectedVariant.price
    };
    
    navigate('/checkout', { state: { buyNowItem } });
  };

  const toggleWishlist = async () => {
    if (isInWishlist(product._id)) {
      await removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(product._id);
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded shadow-sm">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Images Gallery */}
        <div className="w-full md:w-1/2">
          <div className="w-full h-80 md:h-96 bg-white rounded overflow-hidden flex items-center justify-center mb-4 p-4">
            {allImages[activeImage] ? (
              <img src={formatImgUrl(allImages[activeImage].url)} alt={product.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">No Image</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setActiveImage(index)}
                  className={`w-16 h-16 flex-shrink-0 border-2 rounded p-1 bg-white flex items-center justify-center transition-colors ${activeImage === index ? 'border-accent shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <img src={formatImgUrl(img.url)} alt="" className="max-w-full max-h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 flex flex-col">
          <span className="text-sm text-accent font-medium mb-1">{product.category?.name}</span>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-text-main pr-4">{product.name}</h1>
            <button 
              onClick={toggleWishlist}
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border transition-colors ${isInWishlist(product._id) ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'}`}
              title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart size={20} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          {(() => {
            const calculatedCount = reviews.length;
            const calculatedAvg = calculatedCount > 0 
              ? (reviews.reduce((acc, r) => acc + r.rating, 0) / calculatedCount).toFixed(1)
              : '0.0';

            return (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Star size={16} className="text-yellow-500 mr-1" fill="currentColor" />
                <span>{calculatedAvg} ({calculatedCount} reviews)</span>
              </div>
            );
          })()}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-text-main">
              ₹{currentPrice}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                ₹{originalPrice}
              </span>
            )}
            {hasDiscount && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
                {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Low Stock Alert */}
          {currentStock > 0 && currentStock <= 5 && (
            <div className="mb-4 animate-fade-in-down">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Hurry! Only {currentStock} left in stock
              </span>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-600 text-sm whitespace-pre-line">{product.description}</p>
          </div>

          {/* Variants selector */}
          <div className="mb-6 border-t pt-4">
            <VariantSelector 
              variants={product.variants} 
              selectedVariant={selectedVariant}
              onSelect={(v) => { setSelectedVariant(v); setActiveImage(0); setQuantity(1); }}
            />
          </div>

          {/* Action area */}
          <div className="mt-auto border-t pt-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="flex items-center border rounded">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                disabled={quantity <= 1}
              >-</button>
              <span className="px-4 py-2 font-medium w-12 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                disabled={quantity >= currentStock}
              >+</button>
            </div>
            
            {currentStock > 0 ? (
              <div className="flex-grow flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 px-4 py-3 rounded font-medium shadow-sm transition-opacity border-2 border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="flex-1 px-4 py-3 rounded font-medium shadow-sm transition-opacity bg-primary text-white hover:bg-opacity-90"
                >
                  Buy Now
                </button>
              </div>
            ) : (
              <button 
                disabled
                className="flex-grow px-6 py-3 rounded font-medium shadow-sm transition-opacity bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              {(() => {
                const calculatedCount = reviews.length;
                const calculatedAvg = calculatedCount > 0 
                  ? reviews.reduce((acc, r) => acc + r.rating, 0) / calculatedCount
                  : 0;
                
                return (
                  <>
                    <h3 className="text-4xl font-bold text-text-main mb-2">{calculatedAvg.toFixed(1)}</h3>
                    <div className="text-yellow-500 text-xl mb-2">
                      {'★'.repeat(Math.round(calculatedAvg))}{'☆'.repeat(5 - Math.round(calculatedAvg))}
                    </div>
                    <p className="text-gray-500 text-sm">Based on {calculatedCount} reviews</p>
                  </>
                );
              })()}
            {/* The review submission section has been relocated to the Orders page */}
          </div>
          
          <div className="md:col-span-2">
            {reviews.length === 0 ? (
              <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
