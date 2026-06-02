import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';

const CartSummary = () => {
  const { cartTotal, cartItemsCount } = useContext(CartContext);
  const navigate = useNavigate();

  const discount = 0; // Can implement discount logic later
  const shipping = 0; // Free delivery for all products
  const finalTotal = cartTotal - discount + shipping;

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h2>
      
      <div className="space-y-3 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({cartItemsCount} items)</span>
          <span className="font-medium">₹{cartTotal}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
        </div>
        
        <div className="border-t pt-3 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₹{finalTotal}</span>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/checkout')}
        className="w-full bg-accent text-white py-3 rounded font-medium shadow-sm hover:bg-opacity-90 transition-colors"
        disabled={cartItemsCount === 0}
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CartSummary;
