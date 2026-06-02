import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

const CartPage = () => {
  const { cart, loading, clearCart, loadCart } = useContext(CartContext);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => loadCart();

    socket.on('cart_updated', handleUpdate);
    socket.on('stock_updated', handleUpdate);

    return () => {
      socket.off('cart_updated', handleUpdate);
      socket.off('stock_updated', handleUpdate);
    };
  }, [socket, loadCart]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your cart...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded shadow-sm max-w-2xl mx-auto mt-8">
        <div className="text-4xl mb-4 text-gray-300">🛒</div>
        <h2 className="text-2xl font-bold text-text-main mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="bg-accent text-white px-6 py-3 rounded font-medium shadow hover:bg-opacity-90 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold text-text-main">Shopping Cart</h1>
        <button 
          onClick={clearCart}
          className="text-sm text-red-500 hover:underline font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3 bg-white p-4 sm:p-6 rounded shadow-sm">
          {cart.items.map((item, index) => (
            <CartItem key={`${item.product._id}-${item.variantId || index}`} item={item} />
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <CartSummary />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
