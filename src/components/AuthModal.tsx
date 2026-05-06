// src/components/AuthModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import PasswordResetForm from './PasswordResetForm';
import AdminLoginForm from './AdminLoginForm';

type AuthView = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentView('login');
    onClose();
  };

  const switchView = (view: AuthView) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onClose={handleClose}
            onSwitchToRegister={() => switchView('register')}
            onSwitchToPasswordReset={() => switchView('reset')}
          />
        );
      case 'register':
        return (
          <RegisterForm
            onClose={handleClose}
            onSwitchToLogin={() => switchView('login')}
          />
        );
      case 'reset':
        return (
          <PasswordResetForm
            onClose={handleClose}
            onSwitchToLogin={() => switchView('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Content */}
          <div className="relative">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
