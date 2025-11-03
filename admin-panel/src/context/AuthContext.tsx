import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser } from '../types';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await adminApi.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      localStorage.removeItem('admin-token');
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, mfaCode?: string) => {
    try {
      const response = await adminApi.post('/auth/login', {
        email,
        password,
        mfaCode,
      });

      const { token, user: userData, requiresMfa } = response.data.data;

      if (requiresMfa && !mfaCode) {
        throw new Error('MFA_REQUIRED');
      }

      localStorage.setItem('admin-token', token);
      setUser(userData);
      toast.success('Login successful');
    } catch (error: any) {
      if (error.message === 'MFA_REQUIRED') {
        throw error;
      }
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin-token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const response = await adminApi.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    return user.permissions.some(
      permission => 
        permission.resource === resource && 
        permission.action === action
    );
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role.name === role;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};