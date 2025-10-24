import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscriptionService, UserPlanInfo } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  planInfo: UserPlanInfo | null;
  isLoading: boolean;
  refreshPlanInfo: () => Promise<void>;
  checkAccess: (action: string) => Promise<{ hasAccess: boolean; message: string }>;
  startTrial: () => Promise<boolean>;
  showUpgradeModal: (feature?: string, message?: string) => void;
  hideUpgradeModal: () => void;
  upgradeModalState: {
    isOpen: boolean;
    feature?: string;
    message?: string;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeModalState, setUpgradeModalState] = useState({
    isOpen: false,
    feature: undefined as string | undefined,
    message: undefined as string | undefined,
  });

  useEffect(() => {
    if (user?.id) {
      refreshPlanInfo();
    } else {
      setPlanInfo(null);
    }
  }, [user?.id]);

  const refreshPlanInfo = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const info = await subscriptionService.getUserPlan(user.id);
      setPlanInfo(info);
    } catch (error) {
      console.error('Failed to load plan info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = async (action: string) => {
    if (!user?.id) {
      return { hasAccess: false, message: 'Please log in to continue' };
    }

    try {
      return await subscriptionService.checkAccess(user.id, action);
    } catch (error) {
      console.error('Failed to check access:', error);
      return { hasAccess: false, message: 'Failed to check access' };
    }
  };

  const startTrial = async () => {
    if (!user?.id) return false;

    try {
      const success = await subscriptionService.startTrial(user.id);
      if (success) {
        await refreshPlanInfo();
      }
      return success;
    } catch (error) {
      console.error('Failed to start trial:', error);
      return false;
    }
  };

  const showUpgradeModal = (feature?: string, message?: string) => {
    setUpgradeModalState({
      isOpen: true,
      feature,
      message: message || subscriptionService.getUpgradeMessage(feature || 'upgrade'),
    });
  };

  const hideUpgradeModal = () => {
    setUpgradeModalState({
      isOpen: false,
      feature: undefined,
      message: undefined,
    });
  };

  const value: SubscriptionContextType = {
    planInfo,
    isLoading,
    refreshPlanInfo,
    checkAccess,
    startTrial,
    showUpgradeModal,
    hideUpgradeModal,
    upgradeModalState,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};