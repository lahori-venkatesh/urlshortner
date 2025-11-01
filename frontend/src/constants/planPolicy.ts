// Centralized Plan Policy System for Pebly SaaS Platform
// This file defines all plan limits and features in one place

export interface PlanFeatures {
  customDomain: boolean;
  analytics: boolean;
  teamCollaboration: boolean;
  whiteLabel?: boolean;
  apiAccess?: boolean;
  prioritySupport?: boolean;
}

export interface PlanLimits {
  name: string;
  domains: number;
  teamMembers: number;
  urlsPerMonth: number;
  qrCodesPerMonth: number;
  filesPerMonth: number;
  trialDays?: number;
  features: PlanFeatures;
}

export const PLAN_POLICY: Record<string, PlanLimits> = {
  FREE: {
    name: "Free",
    domains: 0,
    teamMembers: 0,
    urlsPerMonth: 100,
    qrCodesPerMonth: 10,
    filesPerMonth: 5,
    trialDays: 7,
    features: {
      customDomain: false,
      analytics: false,
      teamCollaboration: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },

  PRO: {
    name: "Pro",
    domains: 1,
    teamMembers: 3,
    urlsPerMonth: 1000,
    qrCodesPerMonth: 100,
    filesPerMonth: 50,
    features: {
      customDomain: true,
      analytics: true,
      teamCollaboration: true,
      whiteLabel: false,
      apiAccess: true,
      prioritySupport: false,
    },
  },

  BUSINESS: {
    name: "Business",
    domains: 3,
    teamMembers: 10,
    urlsPerMonth: 10000,
    qrCodesPerMonth: 1000,
    filesPerMonth: 500,
    features: {
      customDomain: true,
      analytics: true,
      teamCollaboration: true,
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },

  BUSINESS_TRIAL: {
    name: "Business Trial",
    domains: 3,
    teamMembers: 10,
    urlsPerMonth: 10000,
    qrCodesPerMonth: 1000,
    filesPerMonth: 500,
    trialDays: 14,
    features: {
      customDomain: true,
      analytics: true,
      teamCollaboration: true,
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
};

// Helper function to get plan policy with fallback
export const getPlanPolicy = (planName?: string): PlanLimits => {
  if (!planName) return PLAN_POLICY.FREE;
  
  const normalizedPlan = planName.toUpperCase().replace(/[^A-Z_]/g, '');
  return PLAN_POLICY[normalizedPlan] || PLAN_POLICY.FREE;
};

// Helper function to check if plan is trial
export const isTrialPlan = (planName?: string): boolean => {
  return planName?.toUpperCase().includes('TRIAL') || false;
};

// Helper function to get upgrade path
export const getUpgradePath = (currentPlan?: string): string => {
  const plan = currentPlan?.toUpperCase();
  
  if (!plan || plan === 'FREE') return 'PRO';
  if (plan === 'PRO') return 'BUSINESS';
  
  return 'BUSINESS';
};