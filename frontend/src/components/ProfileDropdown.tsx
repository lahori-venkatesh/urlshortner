import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Crown, BarChart3, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useNavigate } from 'react-router-dom';
import TeamSwitcher from './TeamSwitcher';

const ProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentScope } = useTeam();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileSettings = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleAnalyticsDashboard = () => {
    setIsOpen(false);
    navigate('/dashboard', { state: { activeSection: 'analytics' } });
  };

  const handleAccountSettings = () => {
    setIsOpen(false);
    navigate('/account-settings');
  };

  const handleUpgradeToPro = () => {
    setIsOpen(false);
    navigate('/pricing');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <img
          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.plan} Plan</p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[80vh] overflow-y-auto"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center">
                      {(user.plan?.includes('PRO') || user.plan?.includes('BUSINESS')) && <Crown className="w-3 h-3 text-yellow-500 mr-1" />}
                      <span className="text-xs font-medium text-blue-600 capitalize">
                        {user.plan?.includes('BUSINESS') ? 'Business' : 
                         user.plan?.includes('PRO') ? 'Pro' : 'Free'} Plan
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="w-3 h-3 mr-1" />
                      {currentScope.name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Switcher */}
            <TeamSwitcher onClose={() => setIsOpen(false)} />

            {/* Menu Items */}
            <div className="py-2 border-t border-gray-100">
              <button 
                onClick={handleProfileSettings}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 mr-3" />
                Profile Settings
              </button>
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate('/dashboard/analytics');
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics Dashboard
              </button>
              
              <button 
                onClick={handleAccountSettings}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-3" />
                Account Settings
              </button>

              {(!user.plan || user.plan === 'free' || user.plan === 'FREE') && (
                <button 
                  onClick={handleUpgradeToPro}
                  className="w-full flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  <Crown className="w-4 h-4 mr-3" />
                  Upgrade to Pro
                </button>
              )}
            </div>

            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={logout}
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
  );
};

export default ProfileDropdown;