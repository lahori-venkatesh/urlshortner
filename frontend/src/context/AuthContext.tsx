import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleAuthService, GoogleUserInfo } from '../services/googleAuth';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium' | 'enterprise';
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

  useEffect(() => {
    // Check if user is logged in from localStorage or Google OAuth
    const savedUser = localStorage.getItem('user');
    const googleUserInfo = googleAuthService.getStoredUserInfo();
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } else if (googleUserInfo && googleAuthService.isAuthenticated()) {
      // Create user from Google info
      const googleUser: User = {
        id: googleUserInfo.id,
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        plan: 'free',
        avatar: googleUserInfo.picture,
        picture: googleUserInfo.picture,
        createdAt: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        language: 'en',
        isAuthenticated: true,
        authProvider: 'google'
      };
      
      setUser(googleUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(googleUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call for email/password login
    const mockUser: User = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email: email,
      plan: 'free',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      language: 'en',
      isAuthenticated: true,
      authProvider: 'email'
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const signup = async (name: string, email: string, password: string) => {
    // Simulate API call for email/password signup
    const mockUser: User = {
      id: Date.now().toString(),
      name: name,
      email: email,
      plan: 'free',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      language: 'en',
      isAuthenticated: true,
      authProvider: 'email'
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const loginWithGoogle = () => {
    // Initiate Google OAuth flow
    googleAuthService.initiateAuth();
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    
    // Also logout from Google if authenticated via Google
    if (user?.authProvider === 'google') {
      googleAuthService.logout();
    }
  };

  const redirectAfterAuth = () => {
    // This will be called by components that have access to navigate
    window.location.href = '/app';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
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