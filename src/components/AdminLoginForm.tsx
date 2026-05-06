// src/components/AdminLoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminLoginFormProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

export default function AdminLoginForm({ onClose, onSwitchToLogin }: AdminLoginFormProps) {
  const { adminLogin, isLoading, error, clearError } = useAuth();
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await adminLogin(adminKey);
      if (onClose) onClose();
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-lg">A</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
        <p className="text-sm text-gray-600 mt-1">Enter your admin key to access the dashboard</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Key
          </label>
          <input
            id="adminKey"
            name="adminKey"
            type="password"
            value={adminKey}
            onChange={(e) => {
              setAdminKey(e.target.value);
              if (error) clearError();
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter admin key"
          />
          <p className="text-xs text-gray-500 mt-1">
            This key is provided by the system administrator
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Authenticating...' : 'Access Admin Panel'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          Back to User Login
        </button>
      </div>
    </div>
  );
}
