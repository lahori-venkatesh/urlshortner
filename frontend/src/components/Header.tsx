import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Link as LinkIcon, 
  Home, 
  Menu, 
  X, 
  Plus, 
  QrCode, 
  Upload, 
  BarChart3, 
  User, 
  Settings, 
  LogOut, 
  Crown,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleCreateClick = (mode: 'url' | 'qr' | 'file') => {
    navigate('/dashboard', { state: { activeSection: 'create', createMode: mode } });
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string, state?: any) => {
    navigate(path, state ? { state } : undefined);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to={isAuthenticated ? "/dashboard" : "/"} 
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pebly
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <div className="relative">
                <ProfileDropdown />
              </div>
            ) : (
              <Link 
                to="/" 
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <>
              {/* Mobile Menu Overlay */}
              {mobileMenuOpen && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                />
              )}
              
              <div className="lg:hidden relative" ref={menuRef}>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6 text-gray-600" />
                  ) : (
                    <Menu className="h-6 w-6 text-gray-600" />
                  )}
                </button>

                {/* Mobile Menu */}
                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto"
                    >
                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
                          alt={user?.name || 'User'}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <div className="flex items-center mt-1">
                            {user?.plan === 'premium' && <Crown className="w-3 h-3 text-yellow-500 mr-1" />}
                            <span className="text-xs font-medium text-blue-600 capitalize">{user?.plan} Plan</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Primary Actions - Create */}
                    <div className="py-2 border-b border-gray-100">
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Create</p>
                      </div>
                      
                      <button 
                        onClick={() => handleCreateClick('url')}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <LinkIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Short Link</p>
                          <p className="text-xs text-gray-500">Create shortened URLs</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleCreateClick('qr')}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <QrCode className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">QR Code</p>
                          <p className="text-xs text-gray-500">Generate custom QR codes</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => handleCreateClick('file')}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Upload className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">File to URL</p>
                          <p className="text-xs text-gray-500">Upload files & create links</p>
                        </div>
                      </button>
                    </div>

                    {/* Navigation */}
                    <div className="py-2 border-b border-gray-100">
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navigate</p>
                      </div>
                      
                      <button 
                        onClick={() => handleNavigation('/dashboard')}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation('/dashboard', { activeSection: 'links' })}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4 mr-3" />
                        My Links
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation('/dashboard', { activeSection: 'qr-codes' })}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <QrCode className="w-4 h-4 mr-3" />
                        My QR Codes
                      </button>
                    </div>

                    {/* Analytics - Lower Priority */}
                    <div className="py-2 border-b border-gray-100">
                      <button 
                        onClick={() => handleNavigation('/dashboard', { activeSection: 'analytics' })}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        Analytics
                      </button>
                    </div>

                    {/* Account */}
                    <div className="py-2">
                      <button 
                        onClick={() => handleNavigation('/profile')}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile Settings
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation('/account-settings')}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Account Settings
                      </button>

                      {user?.plan === 'free' && (
                        <button 
                          onClick={() => handleNavigation('/pricing')}
                          className="w-full flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Crown className="w-4 h-4 mr-3" />
                          Upgrade to Premium
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Non-authenticated mobile */}
          {!isAuthenticated && (
            <div className="lg:hidden">
              <Link 
                to="/" 
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors p-2"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;