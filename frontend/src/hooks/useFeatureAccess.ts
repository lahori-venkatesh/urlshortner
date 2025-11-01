import { useMemo } from 'react';
import { usePlanLimits, useIsFree, useIsPaid } from './usePlanLimits';
import { getUpgradePath, isTrialPlan, PlanFeatures } from '../constants/planPolicy';

interface User {
  id?: string;
  plan?: string;
  trialActive?: boolean;
  trialExpiresAt?: string;
}

interface FeatureAccessResult {
  // Domain access
  canAddDomain: (currentDomainCount: number) => boolean;
  canUseDomains: boolean;
  domainLimit: number;
  
  // Team access
  canAddTeamMember: (currentMemberCount: number) => boolean;
  canUseTeams: boolean;
  teamMemberLimit: number;
  
  // Feature access
  hasFeature: (feature: keyof PlanFeatures) => boolean;
  canUseAnalytics: boolean;
  canUseCustomDomain: boolean;
  canUseTeamCollaboration: boolean;
  canUseWhiteLabel: boolean;
  canUseApiAccess: boolean;
  canUsePrioritySupport: boolean;
  
  // URL Shortener Premium Features
  canUseCustomAlias: boolean;
  canUsePasswordProtection: boolean;
  canUseLinkExpiration: boolean;
  canUseClickLimits: boolean;
  
  // QR Code Premium Features
  canUseCustomQRColors: boolean;
  canUseQRLogo: boolean;
  canUseQRBranding: boolean;
  canUseAdvancedQRSettings: boolean;
  
  // File Upload Premium Features
  canUseAdvancedFileSettings: boolean;
  
  // Usage limits
  canCreateUrl: (currentCount: number) => boolean;
  canCreateQR: (currentCount: number) => boolean;
  canUploadFile: (currentCount: number) => boolean;
  
  // Plan info
  limits: ReturnType<typeof usePlanLimits>;
  isFree: boolean;
  isPaid: boolean;
  isTrial: boolean;
  upgradePath: string;
  
  // Helper methods
  getUpgradeReason: (feature: string, currentCount?: number) => string;
  shouldShowUpgradeModal: (feature: string, currentCount?: number) => boolean;
}

/**
 * Comprehensive hook for checking feature access and plan limits
 * @param user - User object with plan information
 * @returns FeatureAccessResult with all access checks and limits
 */
export const useFeatureAccess = (user?: User | null): FeatureAccessResult => {
  const limits = usePlanLimits(user?.plan);
  const isFree = useIsFree(user?.plan);
  const isPaid = useIsPaid(user?.plan);
  const isTrial = isTrialPlan(user?.plan);
  const upgradePath = getUpgradePath(user?.plan);

  return useMemo(() => {
    // Domain access functions
    const canAddDomain = (currentDomainCount: number): boolean => {
      return currentDomainCount < limits.domains;
    };

    const canUseDomains = limits.features.customDomain;

    // Team access functions
    const canAddTeamMember = (currentMemberCount: number): boolean => {
      return currentMemberCount < limits.teamMembers;
    };

    const canUseTeams = limits.features.teamCollaboration;

    // Feature access functions
    const hasFeature = (feature: keyof PlanFeatures): boolean => {
      return !!limits.features[feature];
    };

    // Usage limit functions
    const canCreateUrl = (currentCount: number): boolean => {
      return currentCount < limits.urlsPerMonth;
    };

    const canCreateQR = (currentCount: number): boolean => {
      return currentCount < limits.qrCodesPerMonth;
    };

    const canUploadFile = (currentCount: number): boolean => {
      return currentCount < limits.filesPerMonth;
    };

    // Helper functions
    const getUpgradeReason = (feature: string, currentCount?: number): string => {
      if (isFree) {
        return `Upgrade to ${upgradePath} to unlock ${feature}`;
      }

      if (feature === 'Custom Domains' && user?.plan === 'PRO') {
        return 'Upgrade to Business for more domains';
      }

      if (feature === 'Team Members' && user?.plan === 'PRO') {
        return 'Upgrade to Business for larger teams';
      }

      if (typeof currentCount === 'number') {
        return `You've reached your ${feature.toLowerCase()} limit for the ${limits.name} plan`;
      }

      return `${feature} is not available in your current plan`;
    };

    const shouldShowUpgradeModal = (feature: string, currentCount?: number): boolean => {
      // Free users always see upgrade modal for paid features
      if (isFree && !hasFeature(feature as any)) {
        return true;
      }

      // Paid users see upgrade modal when they hit limits
      if (isPaid && typeof currentCount === 'number') {
        if (feature === 'Custom Domains' && !canAddDomain(currentCount)) {
          return user?.plan === 'PRO'; // PRO users can upgrade to BUSINESS
        }
        if (feature === 'Team Members' && !canAddTeamMember(currentCount)) {
          return user?.plan === 'PRO'; // PRO users can upgrade to BUSINESS
        }
      }

      return false;
    };

    return {
      // Domain access
      canAddDomain,
      canUseDomains,
      domainLimit: limits.domains,

      // Team access
      canAddTeamMember,
      canUseTeams,
      teamMemberLimit: limits.teamMembers,

      // Feature access
      hasFeature,
      canUseAnalytics: hasFeature('analytics'),
      canUseCustomDomain: hasFeature('customDomain'),
      canUseTeamCollaboration: hasFeature('teamCollaboration'),
      canUseWhiteLabel: hasFeature('whiteLabel'),
      canUseApiAccess: hasFeature('apiAccess'),
      canUsePrioritySupport: hasFeature('prioritySupport'),
      
      // URL Shortener Premium Features
      canUseCustomAlias: hasFeature('customAlias'),
      canUsePasswordProtection: hasFeature('passwordProtection'),
      canUseLinkExpiration: hasFeature('linkExpiration'),
      canUseClickLimits: hasFeature('clickLimits'),
      
      // QR Code Premium Features
      canUseCustomQRColors: hasFeature('customQRColors'),
      canUseQRLogo: hasFeature('qrLogo'),
      canUseQRBranding: hasFeature('qrBranding'),
      canUseAdvancedQRSettings: hasFeature('advancedQRSettings'),
      
      // File Upload Premium Features
      canUseAdvancedFileSettings: hasFeature('advancedFileSettings'),

      // Usage limits
      canCreateUrl,
      canCreateQR,
      canUploadFile,

      // Plan info
      limits,
      isFree,
      isPaid,
      isTrial,
      upgradePath,

      // Helper methods
      getUpgradeReason,
      shouldShowUpgradeModal,
    };
  }, [limits, isFree, isPaid, isTrial, upgradePath, user?.plan]);
};