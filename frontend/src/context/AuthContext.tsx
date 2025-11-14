import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleAuthService, GoogleUserInfo } from '../services/googleAuth';
import { normalizePlanName } from '../constants/planPolicy';
import * as api from '../services/api';

// Extend window interface for auth intervals
declare global {
  interface Window {
    authIntervals: NodeJS.Timeout[];
  }
}

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
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
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
    
    // Listen for auth events from API interceptor
    const handleAuthLogout = () => {
      console.log('Received auth-logout event, clearing user state');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      // Clear any intervals
      if (window.authIntervals) {
        window.authIntervals.forEach(clearInterval);
        window.authIntervals = [];
      }
      // Redirect to home page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    };

    const handleTokenRefresh = (event: CustomEvent) => {
      console.log('Received auth-token-refreshed event, updating user state');
      const { token: newToken, user: userData } = event.detail;
      
      const user: User = {
        id: userData.id,
        name: `${userData.firstName} ${userData.lastName}`.trim() || userData.email.split('@')[0],
        email: userData.email,
        plan: normalizePlanName(userData.subscriptionPlan || 'FREE'),
        subscriptionPlan: userData.subscriptionPlan,
        subscriptionExpiry: userData.subscriptionExpiry || undefined,
        avatar: userData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName || userData.email.split('@')[0])}&background=3b82f6&color=fff`,
        picture: userData.profilePicture,
        createdAt: userData.createdAt,
        timezone: 'Asia/Kolkata',
        language: 'en',
        isAuthenticated: true,
        authProvider: userData.authProvider === 'GOOGLE' ? 'google' : 'email'
      };
      
      setUser(user);
      setToken(newToken);
      setIsAuthenticated(true);
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    window.addEventListener('auth-token-refreshed', handleTokenRefresh as EventListener);
    
    // Handle user updates (e.g., after successful payment)
    const handleUserUpdate = (event: CustomEvent) => {
      const { user: updatedUser } = event.detail;
      console.log('User update event received:', updatedUser);
      
      if (updatedUser && user) {
        const newUser: User = {
          ...user,
          plan: normalizePlanName(updatedUser.subscriptionPlan || updatedUser.plan || 'FREE'),
          subscriptionPlan: updatedUser.subscriptionPlan,
          subscriptionExpiry: updatedUser.subscriptionExpiry
        };
        
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(newUser));
        
        setUser(newUser);
        console.log('User context updated with new subscription:', newUser.plan);
        
        // Force refresh of subscription context
        window.dispatchEvent(new CustomEvent('subscription-updated'));
      }
    };
    
    window.addEventListener('auth-user-updated', handleUserUpdate as EventListener);
    
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
                plan: normalizePlanName(data.user.subscriptionPlan || 'FREE'),
                subscriptionPlan: data.user.subscriptionPlan,
                subscriptionExpiry: data.user.subscriptionExpiry || undefined,
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
              
              // Set up token expiry tracking
              localStorage.setItem('tokenExpiry', (Date.now() + 86400000).toString());
              
              // Start session management
              startSessionManagement();
              
              console.log('Authentication restored successfully');
            } else {
              throw new Error('Token validation failed');
            }
          } catch (error) {
            console.error('Token validation failed, attempting token refresh:', error);
            
            // Try to refresh the token instead of falling back
            try {
              console.log('Attempting automatic token refresh...');
              const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
              const refreshResponse = await fetch(`${apiUrl}/v1/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${savedToken}`,
                  'Content-Type': 'application/json',
                },
              });
              
              const refreshData = await refreshResponse.json();
              
              if (refreshData.success && refreshData.token && refreshData.user) {
                console.log('Token refreshed successfully during initialization');
                
                const user: User = {
                  id: refreshData.user.id,
                  name: `${refreshData.user.firstName} ${refreshData.user.lastName}`.trim() || refreshData.user.email.split('@')[0],
                  email: refreshData.user.email,
                  plan: normalizePlanName(refreshData.user.subscriptionPlan || 'FREE'),
                  subscriptionPlan: refreshData.user.subscriptionPlan,
                  subscriptionExpiry: refreshData.user.subscriptionExpiry || undefined,
                  avatar: refreshData.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(refreshData.user.firstName || refreshData.user.email.split('@')[0])}&background=3b82f6&color=fff`,
                  picture: refreshData.user.profilePicture,
                  createdAt: refreshData.user.createdAt,
                  timezone: 'Asia/Kolkata',
                  language: 'en',
                  isAuthenticated: true,
                  authProvider: refreshData.user.authProvider === 'GOOGLE' ? 'google' : 'email'
                };
                
                // Update stored auth data
                localStorage.setItem('token', refreshData.token);
                localStorage.setItem('user', JSON.stringify(user));
                
                setUser(user);
                setToken(refreshData.token);
                setIsAuthenticated(true);
                console.log('Authentication restored via token refresh');
              } else {
                throw new Error('Token refresh failed');
              }
            } catch (refreshError) {
              console.error('Token refresh failed during initialization, clearing auth:', refreshError);
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
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
      window.removeEventListener('auth-token-refreshed', handleTokenRefresh as EventListener);
      window.removeEventListener('auth-user-updated', handleUserUpdate as EventListener);
    };
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
          plan: normalizePlanName(response.user.subscriptionPlan || 'FREE'),
          subscriptionPlan: response.user.subscriptionPlan,
          subscriptionExpiry: response.user.subscriptionExpiry,
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
          plan: normalizePlanName(response.user.subscriptionPlan || 'FREE'),
          subscriptionPlan: response.user.subscriptionPlan,
          subscriptionExpiry: response.user.subscriptionExpiry,
          avatar: response.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.firstName || response.user.email.split('@')[0])}&background=3b82f6&color=fff`,
          createdAt: response.user.createdAt,
          timezone: 'Asia/Kolkata',
          language: 'en',
          isAuthenticated: true,
          authProvider: 'email'
        };
        
        console.log('Setting user with token:', user.email);
        setUserWithAuth(user, response.token);
        
        // Set up token expiry tracking and session management
        localStorage.setItem('tokenExpiry', (Date.now() + 86400000).toString());
        startSessionManagement();
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
          plan: normalizePlanName(response.user.subscriptionPlan || 'FREE'),
          subscriptionPlan: response.user.subscriptionPlan,
          subscriptionExpiry: response.user.subscriptionExpiry || undefined,
          avatar: response.user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.firstName || response.user.email.split('@')[0])}&background=3b82f6&color=fff`,
          createdAt: response.user.createdAt,
          timezone: 'Asia/Kolkata',
          language: 'en',
          isAuthenticated: true,
          authProvider: 'email'
        };
        
        setUserWithAuth(user, response.token);
        
        // Set up token expiry tracking and session management
        localStorage.setItem('tokenExpiry', (Date.now() + 86400000).toString());
        startSessionManagement();
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Signup failed');
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Check configuration before initiating auth
      const backendConfig = await googleAuthService.checkBackendConfig();
      
      if (!backendConfig.success) {
        throw new Error('Unable to connect to authentication server. Please try again later.');
      }
      
      if (!backendConfig.clientIdConfigured) {
        throw new Error('Google OAuth is not properly configured on the server. Please contact support.');
      }
      
      if (!backendConfig.clientSecretConfigured) {
        throw new Error('Google OAuth is not properly configured on the server. Please contact support.');
      }
      
      // Initiate Google OAuth flow
      googleAuthService.initiateAuth();
    } catch (error) {
      console.error('Google OAuth configuration error:', error);
      throw error;
    }
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

  // Session management functions - TEMPORARILY DISABLED DUE TO BACKEND ISSUES
  const startSessionManagement = () => {
    console.log('⚠️ Session management temporarily disabled due to backend connectivity issues');
    
    // Clear any existing intervals
    if (window.authIntervals) {
      window.authIntervals.forEach(clearInterval);
      window.authIntervals = [];
    }
    
    // TODO: Re-enable when backend is stable
    // For now, we'll rely on manual token validation only
    
    /* DISABLED - CAUSING TIMEOUTS
    // Proactive token refresh every 30 minutes
    const refreshInterval = setInterval(async () => {
      if (isAuthenticated) {
        try {
          const success = await api.proactiveTokenRefresh();
          if (!success) {
            console.warn('Proactive token refresh failed, user may be logged out soon');
          }
        } catch (error) {
          console.error('Proactive token refresh error:', error);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Session heartbeat every 5 minutes
    const heartbeatInterval = setInterval(async () => {
      if (isAuthenticated) {
        try {
          const isValid = await api.sessionHeartbeat();
          if (!isValid) {
            console.warn('Session heartbeat failed, logging out user');
            logout();
          }
        } catch (error) {
          console.error('Session heartbeat error:', error);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Store intervals for cleanup
    window.authIntervals.push(refreshInterval, heartbeatInterval);
    */
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