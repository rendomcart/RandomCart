import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';

const WishlistPage = () => {
  const { wishlist, loading, removeFromWishlist } = useContext(WishlistContext);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your wishlist...</div>;

  if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded shadow-sm max-w-2xl mx-auto mt-8">
        <div className="text-4xl mb-4 text-gray-300">❤️</div>
        <h2 className="text-2xl font-bold text-text-main mb-2">Your Wishlist is Empty</h2>
        <p className="text-gray-500 mb-6">Save items you love here and buy them later.</p>
        <Link to="/products" className="bg-accent text-white px-6 py-3 rounded font-medium shadow hover:bg-opacity-90 transition-colors">
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text-main mb-6">My Wishlist</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.products.map((product, index) => (
          <div key={`${product._id}-${index}`} className="relative">
            <ProductCard product={product} />
            <button 
              onClick={() => removeFromWishlist(product._id)}
              className="absolute top-2 right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors z-10"
              title="Remove from wishlist"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;
