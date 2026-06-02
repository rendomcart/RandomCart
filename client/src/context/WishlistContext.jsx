import { createContext, useReducer, useEffect, useContext } from 'react';
import * as wishlistApi from '../api/wishlist.api';
import { AuthContext } from './AuthContext';
import { toast } from 'react-hot-toast';

export const WishlistContext = createContext();

const initialState = {
  wishlist: null,
  loading: false,
};

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_WISHLIST':
      return { ...state, wishlist: null, loading: false };
    default:
      return state;
  }
};

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      dispatch({ type: 'CLEAR_WISHLIST' });
    }
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await wishlistApi.getWishlist();
      if (data.success) {
        dispatch({ type: 'SET_WISHLIST', payload: data.data });
      }
    } catch (error) {
      console.error(error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToWishlist = async (productId) => {
    try {
      const { data } = await wishlistApi.addToWishlist({ productId });
      if (data.success) {
        dispatch({ type: 'SET_WISHLIST', payload: data.data });
        return { success: true };
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error adding to wishlist';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await wishlistApi.removeFromWishlist(productId);
      if (data.success) {
        dispatch({ type: 'SET_WISHLIST', payload: data.data });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId) => {
    if (!state.wishlist || !state.wishlist.products) return false;
    return state.wishlist.products.some(p => p._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ 
      ...state, 
      addToWishlist, 
      removeFromWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
