import { createContext, useReducer, useEffect } from 'react';
import * as authApi from '../api/auth.api';

export const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAIL':
    case 'LOAD_USER_FAIL':
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = async () => {
    try {
      const { data } = await authApi.getMe();
      if (data.success) {
        dispatch({ type: 'LOAD_USER_SUCCESS', payload: data.data });
      } else {
        dispatch({ type: 'LOAD_USER_FAIL' });
      }
    } catch (error) {
      dispatch({ type: 'LOAD_USER_FAIL' });
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await authApi.login({ ...credentials, appType: 'user' });
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.data });
      return data;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      throw error.response?.data || error.message;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
