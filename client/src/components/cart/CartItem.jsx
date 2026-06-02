import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart, getLivePrice } = useContext(CartContext);
  
  const product = item.product;
  
  let variant = null;
  let stock = 0;
  
  if (item.variantId && product.variants) {
    variant = product.variants.find(v => v._id === item.variantId);
    if (variant) stock = variant.stock;
  }

  // Find image directly from item
  const image = item.image;

  return (
    <div className="flex flex-col sm:flex-row gap-4 border-b py-4">
      {/* Image */}
      <div className="w-full sm:w-24 h-24 bg-gray-100 flex-shrink-0 rounded overflow-hidden">
        {image ? (
          <img src={formatImgUrl(image)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.slug}`} className="font-semibold text-text-main hover:text-accent line-clamp-1">
            {product.name}
          </Link>
          
          <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
            {item.color && <span>Color: {item.color}</span>}
            {item.size && <span>Size: {item.size}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 sm:mt-0">
          <div className="font-bold">
            ₹{getLivePrice ? getLivePrice(item) : item.price}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quantity Stepper */}
            <div className="flex items-center border rounded">
              <button 
                onClick={() => updateQuantity(product._id, item.variantId, item.quantity - 1)}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                disabled={item.quantity <= 1}
              >-</button>
              <span className="px-3 py-1 font-medium text-sm w-10 text-center">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(product._id, item.variantId, item.quantity + 1)}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                disabled={item.quantity >= stock}
              >+</button>
            </div>
            
            {/* Remove */}
            <button 
              onClick={() => removeFromCart(product._id, item.variantId)}
              className="text-red-500 hover:underline text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
