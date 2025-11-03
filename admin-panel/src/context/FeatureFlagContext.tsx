import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeatureFlag } from '../types';
import { adminApiEndpoints } from '../services/api';
import { useAuth } from './AuthContext';

interface FeatureFlagContextType {
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadFeatureFlags();
    }
  }, [isAuthenticated]);

  const loadFeatureFlags = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiEndpoints.featureFlags.list();
      const flagsArray = response.data.data;
      
      const flagsMap = flagsArray.reduce((acc: Record<string, FeatureFlag>, flag: FeatureFlag) => {
        acc[flag.key] = flag;
        return acc;
      }, {});
      
      setFlags(flagsMap);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFeatureEnabled = (key: string): boolean => {
    const flag = flags[key];
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check if user has required role
    if (flag.targetRoles.length > 0 && user) {
      if (!flag.targetRoles.includes(user.role.name)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      // Simple hash-based rollout (in production, use more sophisticated logic)
      const userId = user?.id || 'anonymous';
      const hash = simpleHash(userId + flag.key);
      const percentage = hash % 100;
      return percentage < flag.rolloutPercentage;
    }

    // Check conditions
    if (flag.conditions.length > 0) {
      return evaluateConditions(flag.conditions, user);
    }

    return true;
  };

  const refreshFlags = async () => {
    await loadFeatureFlags();
  };

  const value: FeatureFlagContextType = {
    flags,
    isLoading,
    isFeatureEnabled,
    refreshFlags,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

// Helper function for simple hashing
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Helper function to evaluate feature flag conditions
function evaluateConditions(conditions: any[], user: any): boolean {
  return conditions.every(condition => {
    switch (condition.type) {
      case 'USER_ROLE':
        if (!user) return false;
        return condition.operator === 'EQUALS' 
          ? user.role.name === condition.value
          : condition.operator === 'IN'
          ? condition.value.includes(user.role.name)
          : !condition.value.includes(user.role.name);
      
      case 'USER_ID':
        if (!user) return false;
        return condition.operator === 'EQUALS'
          ? user.id === condition.value
          : condition.operator === 'IN'
          ? condition.value.includes(user.id)
          : !condition.value.includes(user.id);
      
      default:
        return true;
    }
  });
}

// Hook for checking specific feature
export const useFeature = (key: string): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(key);
};