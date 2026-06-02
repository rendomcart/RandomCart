import { createContext, useReducer, useEffect } from 'react';
import * as authApi from '../api/auth.api';

export const AdminAuthContext = createContext();

const initialState = {
  adminUser: null,
  isAdminAuthenticated: false,
  loading: true,
};

const adminAuthReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'LOAD_USER_SUCCESS':
      // Verify if role is actually admin
      if (action.payload.role !== 'admin') {
        return {
          ...state,
          adminUser: null,
          isAdminAuthenticated: false,
          loading: false,
        };
      }
      return {
        ...state,
        adminUser: action.payload,
        isAdminAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAIL':
    case 'LOAD_USER_FAIL':
    case 'LOGOUT':
      return {
        ...state,
        adminUser: null,
        isAdminAuthenticated: false,
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

export const AdminAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminAuthReducer, initialState);

  const loadUser = async () => {
    try {
      const { data } = await authApi.getMe();
      if (data.success && data.data.role === 'admin') {
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
      const { data } = await authApi.login(credentials);
      if (data.data.role === 'admin') {
        dispatch({ type: 'LOGIN_SUCCESS', payload: data.data });
        return data;
      } else {
        dispatch({ type: 'LOGIN_FAIL' });
        throw { message: 'Not authorized as admin' };
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL' });
      throw error.response?.data || error;
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
    <AdminAuthContext.Provider value={{ ...state, login, logout, loadUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
