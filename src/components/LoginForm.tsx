// src/components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToPasswordReset?: () => void;
}

export default function LoginForm({ onClose, onSwitchToRegister, onSwitchToPasswordReset }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(formData.email, formData.password);
      if (onClose) onClose();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-6 space-y-3 text-center">
        <div className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign up
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          <button
            type="button"
            onClick={onSwitchToPasswordReset}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
