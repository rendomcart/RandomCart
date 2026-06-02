import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { WishlistContext } from '../../context/WishlistContext';
import { AuthContext } from '../../context/AuthContext';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const ProductCard = ({ product }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      navigate('/auth/login');
      return;
    }
    
    if (isInWishlist(product._id)) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow relative">
      <button 
        onClick={toggleWishlist}
        className={`absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full border shadow-sm transition-colors ${isInWishlist(product._id) ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'}`}
        title={isInWishlist(product._id) ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <Heart size={16} fill={isInWishlist(product._id) ? 'currentColor' : 'none'} />
      </button>
      
      <Link to={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-100">
        {product.variants?.[0]?.images?.[0] ? (
          <img 
            src={formatImgUrl(product.variants[0].images[0].url)} 
            alt={product.name} 
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </Link>
      
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-semibold text-text-main line-clamp-2 mb-1 hover:text-accent">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-lg">
            ₹{product.displayPrice || product.basePrice}
          </span>
          <div className="flex items-center text-xs text-gray-500">
            <span className="text-yellow-500 mr-1">★</span>
            <span>{product.ratings?.average || 0} ({product.ratings?.count || 0})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
