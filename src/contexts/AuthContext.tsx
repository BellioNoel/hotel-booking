// src/contexts/AuthContext.tsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { usePendingBooking } from '../hooks/usePendingBooking';
import { useToast } from './ToastContext';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Token management functions
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  adminLogin: (adminKey: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();
  const toast = useToast();

  // Handle pending bookings after login
  usePendingBooking();

  // Check for existing token on mount
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Validate token by fetching user profile
      validateToken();
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await authAPI.getProfile();
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      
      // Redirect based on role if token is valid
      if (response.user.role === 'admin') {
        navigate('/admin');
      }
    } catch (error) {
      // Token is invalid, remove it
      removeAuthToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.login({ email, password });
      setAuthToken(response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      
      // Show success message
      toast.showSuccess(
        'Login Successful!',
        `Welcome back, ${response.user.firstName}!`
      );
      
      // Redirect based on role
      if (response.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/booking');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.showError('Login Failed', errorMessage);
      throw error;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.register(userData);
      setAuthToken(response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      
      // Show success message
      toast.showSuccess(
        'Registration Successful!',
        `Welcome to Franc Hotel, ${response.user.firstName}!`
      );
      
      // Redirect to booking page
      navigate('/booking');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.showError('Registration Failed', errorMessage);
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
    toast.showInfo('Logged Out', 'You have been successfully logged out.');
    navigate('/');
  };

  const updateProfile = async (userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => {
    try {
      const response = await authAPI.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: response.user });
      toast.showSuccess('Profile Updated', 'Your profile has been successfully updated.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.showError('Profile Update Failed', errorMessage);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.showSuccess('Password Changed', 'Your password has been successfully changed.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.showError('Password Change Failed', errorMessage);
      throw error;
    }
  };

  const adminLogin = async (adminKey: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.adminLogin(adminKey);
      setAuthToken(response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      
      toast.showSuccess('Admin Login Successful!', 'Welcome to the admin panel.');
      navigate('/admin');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Admin login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.showError('Admin Login Failed', errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    adminLogin,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
