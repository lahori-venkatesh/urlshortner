

export interface UserPlanInfo {
  plan: string;
  hasProAccess: boolean;
  inTrial: boolean;
  trialEligible: boolean;
  subscriptionExpiry: string | null;
  remainingDailyUrls: number;
  remainingDailyQrCodes: number;
  remainingDailyFiles: number;
  remainingMonthlyUrls: number;
  remainingMonthlyQrCodes: number;
  remainingMonthlyFiles: number;
  maxFileSizeMB: number;
  canUseCustomAlias: boolean;
  canUsePasswordProtection: boolean;
  canSetExpiration: boolean;
  canUseCustomDomain: boolean;
  canAccessDetailedAnalytics: boolean;
  canCustomizeQrCodes: boolean;
}

export interface PricingPlan {
  name: string;
  price: number;
  currency: string;
  period: string;
  savings?: number;
  features: string[];
}

export interface PricingData {
  free: PricingPlan;
  monthly: PricingPlan;
  yearly: PricingPlan;
  business: PricingPlan;
}

class SubscriptionService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  /**
   * Get user's current plan information
   */
  async getUserPlan(userId: string): Promise<UserPlanInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscription/plan/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get plan information');
      }
    } catch (error) {
      console.error('Error getting user plan:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform specific action
   */
  async checkAccess(userId: string, action: string): Promise<{ hasAccess: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscription/check/${userId}/${action}`);
      const result = await response.json();
      
      if (result.success) {
        return {
          hasAccess: result.hasAccess,
          message: result.message || ''
        };
      } else {
        throw new Error(result.message || 'Failed to check access');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      throw error;
    }
  }

  /**
   * Start trial for eligible user
   */
  async startTrial(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscription/trial/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      return result.success;
    } catch (error) {
      console.error('Error starting trial:', error);
      throw error;
    }
  }

  /**
   * Upgrade user to pro plan
   */
  async upgradePlan(userId: string, planType: string, subscriptionId?: string, customerId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planType,
          subscriptionId,
          customerId
        }),
      });
      const result = await response.json();
      
      return result.success;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<PricingData> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/subscription/pricing`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get pricing information');
      }
    } catch (error) {
      console.error('Error getting pricing:', error);
      throw error;
    }
  }

  /**
   * Initialize Razorpay payment
   */
  async initializePayment(planType: string, userId: string): Promise<any> {
    const pricing = await this.getPricing();
    let amount = 0;
    let planName = '';

    switch (planType) {
      case 'PRO_MONTHLY':
        amount = 349 * 100; // Convert to paise
        planName = 'Pro Monthly';
        break;
      case 'PRO_YEARLY':
        amount = 2999 * 100;
        planName = 'Pro Yearly';
        break;
      case 'BUSINESS_MONTHLY':
        amount = 699 * 100;
        planName = 'Business Monthly';
        break;
      case 'BUSINESS_YEARLY':
        amount = 5999 * 100;
        planName = 'Business Yearly';
        break;
      default:
        throw new Error('Invalid plan type');
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: amount,
          currency: 'INR',
          name: 'Pebly',
          description: `Upgrade to ${planName}`,
          image: `${process.env.PUBLIC_URL}/round-logo-ts.png`,
          handler: async (response: any) => {
            try {
              // Verify payment and upgrade user
              const upgraded = await this.upgradePlan(
                userId, 
                planType, 
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              
              if (upgraded) {
                resolve(response);
              } else {
                reject(new Error('Payment verification failed'));
              }
            } catch (error) {
              reject(error);
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: ''
          },
          theme: {
            color: '#3B82F6'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.head.appendChild(script);
    });
  }

  /**
   * Format plan name for display
   */
  formatPlanName(plan: string): string {
    switch (plan) {
      case 'FREE':
        return 'Free';
      case 'PRO_MONTHLY':
        return 'Pro Monthly';
      case 'PRO_YEARLY':
        return 'Pro Yearly';
      case 'BUSINESS_MONTHLY':
        return 'Business Monthly';
      case 'BUSINESS_YEARLY':
        return 'Business Yearly';
      default:
        return plan;
    }
  }

  /**
   * Get plan badge color
   */
  getPlanBadgeColor(plan: string): string {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      case 'PRO_MONTHLY':
        return 'bg-blue-100 text-blue-800';
      case 'PRO_YEARLY':
        return 'bg-blue-100 text-blue-800';
      case 'BUSINESS_MONTHLY':
        return 'bg-purple-100 text-purple-800';
      case 'BUSINESS_YEARLY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Check if feature requires upgrade
   */
  getUpgradeMessage(feature: string): string {
    const messages: { [key: string]: string } = {
      'custom-alias': 'Custom aliases are available with Pro plans. Create branded short links!',
      'password-protection': 'Password protection is available with Pro plans. Secure your links!',
      'expiration': 'Link expiration is available with Pro plans. Set automatic expiry dates!',
      'custom-domain': 'Custom domains are available with Pro plans. Use your own domain!',
      'detailed-analytics': 'Detailed analytics are available with Pro plans. See where your audience is from!',
      'customize-qr': 'QR code customization is available with Pro plans. Add your logo and colors!',
      'daily-limit': 'You\'ve reached your monthly limit. Upgrade to Pro for unlimited access!'
    };

    return messages[feature] || 'This feature is available with Pro plans.';
  }
}

export const subscriptionService = new SubscriptionService();