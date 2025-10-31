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
  token: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Add loading state to interface
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
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Custom setUser function that also updates isAuthenticated
  const setUserWithAuth = (newUser: User | null, authToken?: string | null) => {
    console.log('=== setUserWithAuth called ===');
    console.log('New user:', newUser ? newUser.email : 'null');
    console.log('Auth token:', authToken ? 'provided' : 'not provided');
    
    setUser(newUser);
    setIsAuthenticated(!!newUser);
    
    if (newUser) {
      try {
        localStorage.setItem('user', JSON.stringify(newUser));
        console.log('User saved to localStorage');
        
        if (authToken) {
          setToken(authToken);
          localStorage.setItem('token', authToken);
          console.log('Token saved to localStorage');
        }
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    } else {
      console.log('Clearing authentication data');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  useEffect(() => {
    console.log('=== AuthContext useEffect - Checking stored auth ===');
    
    const initializeAuth = async () => {
      try {
        // Check if user is logged in from localStorage or Google OAuth
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        const googleUserInfo = googleAuthService.getStoredUserInfo();
        
        console.log('Saved user:', savedUser ? 'exists' : 'null');
        console.log('Saved token:', savedToken ? 'exists' : 'null');
        console.log('Google user info:', googleUserInfo ? 'exists' : 'null');
        
        if (savedUser && savedToken) {
          try {
            // Try to validate token with backend
            const data = await api.validateToken(savedToken);
            
            if (data.success && data.user) {
              console.log('Token validated successfully, restoring user:', data.user.email);
              const user: User = {
                id: data.user.id,
                name: `${data.user.firstName} ${data.user.lastName}`.trim() || data.user.email.split('@')[0],
                email: data.user.email,
                plan: data.user.subscriptionPlan || 'free',
                avatar: data.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.firstName || data.user.email.split('@')[0])}&background=3b82f6&color=fff`,
                picture: data.user.profilePicture,
                createdAt: data.user.createdAt,
                timezone: 'Asia/Kolkata',
                language: 'en',
                isAuthenticated: true,
                authProvider: data.user.authProvider === 'GOOGLE' ? 'google' : 'email'
              };
              
              setUser(user);
              setToken(savedToken);
              setIsAuthenticated(true);
              console.log('Authentication restored successfully');
            } else {
              throw new Error('Token validation failed');
            }
          } catch (error) {
            console.error('Token validation failed, trying fallback:', error);
            
            // FALLBACK: If token validation fails but we have saved user data,
            // restore the session temporarily (for better UX during backend issues)
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log('Using fallback authentication for user:', parsedUser.email);
              
              // Create user object from saved data
              const user: User = {
                id: parsedUser.id,
                name: parsedUser.name,
                email: parsedUser.email,
                plan: parsedUser.plan || 'free',
                avatar: parsedUser.avatar,
                picture: parsedUser.picture,
                createdAt: parsedUser.createdAt,
                timezone: parsedUser.timezone || 'Asia/Kolkata',
                language: parsedUser.language || 'en',
                isAuthenticated: true,
                authProvider: parsedUser.authProvider || 'email'
              };
              
              setUser(user);
              setToken(savedToken);
              setIsAuthenticated(true);
              console.log('Fallback authentication successful');
              
              // Show a warning that backend validation failed
              console.warn('Using cached authentication - backend validation unavailable');
              
            } catch (fallbackError) {
              console.error('Fallback authentication failed, clearing localStorage:', fallbackError);
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setUser(null);
              setToken(null);
              setIsAuthenticated(false);
            }
          }
        } else if (googleUserInfo && googleAuthService.isAuthenticated()) {
          console.log('Authenticating with Google info');
          // Authenticate with backend using Google info
          await handleGoogleAuth(googleUserInfo);
        } else {
          console.log('No valid authentication found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear any invalid auth state
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // Always set loading to false
      }
    };

    initializeAuth();
  }, []);

  const handleGoogleAuth = async (googleUserInfo: GoogleUserInfo) => {
    try {
      console.log('=== Google Auth attempt ===');
      console.log('Google user info:', googleUserInfo);
      
      const response = await api.googleAuth({
        email: googleUserInfo.email,
        googleId: googleUserInfo.id,
        firstName: googleUserInfo.given_name || googleUserInfo.name.split(' ')[0] || '',
        lastName: googleUserInfo.family_name || googleUserInfo.name.split(' ').slice(1).join(' ') || '',
        profilePicture: googleUserInfo.picture
      });
      
      console.log('Google auth response:', response);
      
      if (response.success && response.user && response.token) {
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
        
        console.log('Setting Google user with token:', user.email);
        setUserWithAuth(user, response.token);
      } else {
        console.error('Google auth failed - invalid response:', response);
        throw new Error('Google authentication failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google auth error details:', error);
      
      // Clear Google auth state
      googleAuthService.logout();
      
      // Throw a user-friendly error
      if (error.message.includes('503') || error.code === 'NETWORK_ERROR') {
        throw new Error('Server is currently unavailable. Please try again later.');
      } else {
        throw new Error('Google authentication failed. Please ensure you have the correct permissions and try again.');
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('=== Login attempt ===');
      console.log('Email:', email);
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      const response = await api.login({ email, password });
      
      console.log('Login response:', response);
      
      if (response.success && response.user && response.token) {
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
        
        console.log('Setting user with token:', user.email);
        setUserWithAuth(user, response.token);
      } else {
        console.error('Login failed - invalid response:', response);
        throw new Error(response.message || 'Login failed - invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // Handle different types of errors
      if (error.code === 'NETWORK_ERROR' || error.message.includes('503')) {
        throw new Error('Server is currently unavailable. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (error.response?.status === 404) {
        throw new Error('User not found. Please check your email or sign up.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
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
        
        setUserWithAuth(user, response.token);
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
      token,
      setUser: setUserWithAuth, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      isAuthenticated,
      isLoading, 
      redirectAfterAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};