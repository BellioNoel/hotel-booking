// src/components/Navigation.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, LogOut, Settings, Calendar, Home, Phone, Info } from 'lucide-react';

interface NavigationProps {
  onOpenAuth?: () => void;
}

export default function Navigation({ onOpenAuth }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Close menus when route changes
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Calendar, label: 'Book Now', href: '/booking' },
    { icon: Phone, label: 'Contact', href: '/contact' },
    { icon: Info, label: 'About', href: '/about-environment' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1a080f]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent-lime-500 text-[#2b0818] font-extrabold text-sm shadow-[0_0_0_2px_rgba(148,215,40,0.25)]">
                FH
              </div>
              <span className="text-xl font-bold tracking-wide text-[#f8f4ef]">Franco Hotel</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-accent-lime-500'
                      : 'text-[#f8f4ef]/80 hover:text-accent-lime-500'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary-600 border border-accent-lime-500/40">
                      <User className="w-4 h-4 text-accent-lime-500" />
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-[#f8f4ef]">
                      {user.firstName}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-lg border border-white/10 bg-[#2a0e1a] shadow-2xl py-1">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-sm font-medium text-[#f8f4ef]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-[#f8f4ef]/60">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-[#f8f4ef]/85 hover:bg-white/10"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        to="/my-bookings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-[#f8f4ef]/85 hover:bg-white/10"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>My Bookings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-accent-lime-500 hover:bg-white/10 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="bg-accent-lime-500 text-[#2b0818] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-lime-300 transition-colors"
                >
                  Sign In
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-[#f8f4ef]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#f8f4ef]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#2a0e1a]">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'bg-primary-600 text-accent-lime-500'
                      : 'text-[#f8f4ef]/85 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {!isAuthenticated && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth?.();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 bg-accent-lime-500 text-[#2b0818] rounded-lg text-sm font-semibold hover:bg-accent-lime-300"
                >
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {(isProfileOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMenuOpen(false);
            setIsProfileOpen(false);
          }}
        />
      )}
    </>
  );
}
