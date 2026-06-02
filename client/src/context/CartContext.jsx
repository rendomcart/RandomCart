import { createContext, useReducer, useEffect, useContext } from 'react';
import * as cartApi from '../api/cart.api';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';

export const CartContext = createContext();

const initialState = {
  cart: null,
  loading: false,
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, cart: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_CART':
      return { ...state, cart: null, loading: false };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await cartApi.getCart();
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
      }
    } catch (error) {
      console.error(error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (productId, variantId, quantity) => {
    try {
      const { data } = await cartApi.addToCart({ productId, variantId, quantity });
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        return { success: true };
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error adding to cart';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const updateQuantity = async (productId, variantId, quantity) => {
    try {
      const { data } = await cartApi.updateCartItem({ productId, variantId, quantity });
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        return { success: true };
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error updating cart';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const removeFromCart = async (productId, variantId) => {
    try {
      const { data } = await cartApi.removeFromCart({ productId, variantId });
      if (data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared');
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear cart');
    }
  };

  const getLivePrice = (item) => {
    if (item.variantId && item.product.variants) {
      const variant = item.product.variants.find(v => v._id === item.variantId);
      if (variant) return variant.discountPrice || variant.price;
    }
    return item.price;
  };

  const cartItemsCount = state.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const cartTotal = state.cart?.items?.reduce((acc, item) => acc + (getLivePrice(item) * item.quantity), 0) || 0;

  return (
    <CartContext.Provider value={{ 
      ...state, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart,
      cartItemsCount,
      cartTotal,
      getLivePrice,
      loadCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
