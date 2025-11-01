import { useMemo } from 'react';
import { getPlanPolicy, PlanLimits } from '../constants/planPolicy';

/**
 * Hook to get plan limits for a user's current plan
 * @param userPlan - The user's current plan (e.g., 'FREE', 'PRO', 'BUSINESS')
 * @returns PlanLimits object with all limits and features for the plan
 */
export const usePlanLimits = (userPlan?: string): PlanLimits => {
  return useMemo(() => {
    return getPlanPolicy(userPlan);
  }, [userPlan]);
};

/**
 * Hook to check if user is on a specific plan
 * @param userPlan - The user's current plan
 * @param targetPlan - The plan to check against
 * @returns boolean indicating if user is on the target plan
 */
export const useIsPlan = (userPlan?: string, targetPlan?: string): boolean => {
  return useMemo(() => {
    if (!userPlan || !targetPlan) return false;
    return userPlan.toUpperCase() === targetPlan.toUpperCase();
  }, [userPlan, targetPlan]);
};

/**
 * Hook to check if user is on a free plan
 * @param userPlan - The user's current plan
 * @returns boolean indicating if user is on free plan
 */
export const useIsFree = (userPlan?: string): boolean => {
  return useIsPlan(userPlan, 'FREE');
};

/**
 * Hook to check if user is on a paid plan
 * @param userPlan - The user's current plan
 * @returns boolean indicating if user is on any paid plan
 */
export const useIsPaid = (userPlan?: string): boolean => {
  return useMemo(() => {
    if (!userPlan) return false;
    const plan = userPlan.toUpperCase();
    return plan !== 'FREE';
  }, [userPlan]);
};