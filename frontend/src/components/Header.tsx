import React from 'react';
import { Link } from 'react-router-dom';
import { Link as LinkIcon, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-1 py-2">
        <div className="flex items-center justify-between">
          <Link to={isAuthenticated ? "/app" : "/"} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <LinkIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
             Pebly
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            {isAuthenticated ? (
              <ProfileDropdown />
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
        </div>
      </div>
    </header>
  );
};

export default Header;