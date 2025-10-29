import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleAuthService, GoogleUserInfo } from '../services/googleAuth';
import * as api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  avatar?: string;
  picture?: string;
  phone?: string;
  location?: string;
  bio?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  timezone?: string;
  language?: string;
  createdAt?: string;
  isAuthenticated?: boolean;
  authProvider?: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  redirectAfterAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Custom setUser function that also updates isAuthenticated
  const setUserWithAuth = (newUser: User | null) => {
    setUser(newUser);
    setIsAuthenticated(!!newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    // Check if user is logged in from localStorage or Google OAuth
    const savedUser = localStorage.getItem('user');
    const googleUserInfo = googleAuthService.getStoredUserInfo();
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } else if (googleUserInfo && googleAuthService.isAuthenticated()) {
      // Authenticate with backend using Google info
      handleGoogleAuth(googleUserInfo);
    }
  }, []);

  const handleGoogleAuth = async (googleUserInfo: GoogleUserInfo) => {
    try {
      const response = await api.googleAuth({
        email: googleUserInfo.email,
        googleId: googleUserInfo.id,
        firstName: googleUserInfo.given_name || googleUserInfo.name.split(' ')[0] || '',
        lastName: googleUserInfo.family_name || googleUserInfo.name.split(' ').slice(1).join(' ') || '',
        profilePicture: googleUserInfo.picture
      });
      
      if (response.success && response.user) {
        const user: User = {
          id: response.user.id,
          name: `${response.user.firstName} ${response.user.lastName}`.trim() || response.user.email.split('@')[0],
          email: response.user.email,
          plan: response.user.subscriptionPlan || 'free',
          avatar: response.user.profilePicture || googleUserInfo.picture,
          picture: response.user.profilePicture || googleUserInfo.picture,
          createdAt: response.user.createdAt,
          timezone: 'Asia/Kolkata',
          language: 'en',
          isAuthenticated: true,
          authProvider: 'google'
        };
        
        setUserWithAuth(user);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      // If backend auth fails, clear Google auth
      googleAuthService.logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      
      if (response.success && response.user) {
        const user: User = {
          id: response.user.id,
          name: `${response.user.firstName} ${response.user.lastName}`.trim() || response.user.email.split('@')[0],
          email: response.user.email,
          plan: response.user.subscriptionPlan || 'free',
          avatar: response.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.firstName || response.user.email.split('@')[0])}&background=3b82f6&color=fff`,
          createdAt: response.user.createdAt,
          timezone: 'Asia/Kolkata',
          language: 'en',
          isAuthenticated: true,
          authProvider: 'email'
        };
        
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const response = await api.signup({ 
        email, 
        password, 
        firstName, 
        lastName 
      });
      
      if (response.success && response.user) {
        const user: User = {
          id: response.user.id,
          name: `${response.user.firstName} ${response.user.lastName}`.trim() || response.user.email.split('@')[0],
          email: response.user.email,
          plan: response.user.subscriptionPlan || 'free',
          avatar: response.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.firstName || response.user.email.split('@')[0])}&background=3b82f6&color=fff`,
          createdAt: response.user.createdAt,
          timezone: 'Asia/Kolkata',
          language: 'en',
          isAuthenticated: true,
          authProvider: 'email'
        };
        
        setUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Signup failed');
    }
  };

  const loginWithGoogle = () => {
    // Initiate Google OAuth flow
    googleAuthService.initiateAuth();
  };

  const logout = () => {
    setUserWithAuth(null);
    
    // Also logout from Google if authenticated via Google
    if (user?.authProvider === 'google') {
      googleAuthService.logout();
    }
  };

  const redirectAfterAuth = () => {
    // This will be called by components that have access to navigate
    window.location.href = '/dashboard';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: setUserWithAuth, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      isAuthenticated, 
      redirectAfterAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};