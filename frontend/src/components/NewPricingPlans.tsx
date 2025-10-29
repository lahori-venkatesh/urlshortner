import React, { useState } from 'react';
import { Check, X, Crown, Zap, Users, BarChart3, Globe, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import toast from 'react-hot-toast';

interface PricingPlansProps {
  onAuthRequired: () => void;
}

const NewPricingPlans: React.FC<PricingPlansProps> = ({ onAuthRequired }) => {
  const { isAuthenticated, user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanSelect = async (planType: string, planName: string, price: number) => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    if (!user?.id) {
      toast.error('Please log in to upgrade');
      return;
    }

    setIsLoading(true);
    try {
      await subscriptionService.initializePayment(planType, user.id);
      toast.success(`Payment successful! Welcome to ${planName}!`);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for students and personal use',
      monthlyPrice: 0,
      yearlyPrice: 0,
      popular: false,
      features: [
        { text: '75 short links per month', included: true },
        { text: '30 QR codes per month', included: true },
        { text: '5 file-to-link conversions per month', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Community support', included: true },
        { text: '1 team member', included: true },
        { text: 'Custom domains', included: false },
        { text: 'API access', included: false },
        { text: 'Priority support', included: false }
      ],
      buttonText: 'Get Started',
      buttonAction: () => {},
      disabled: false
    },
    {
      name: 'Pro',
      description: 'Ideal for freelancers and small businesses',
      monthlyPrice: 349,
      yearlyPrice: 2999,
      popular: true,
      features: [
        { text: 'Unlimited short links', included: true },
        { text: 'Unlimited QR codes', included: true },
        { text: '50 file-to-link conversions per month', included: true },
        { text: 'Advanced analytics', included: true },
        { text: '1 custom domain', included: true },
        { text: 'Up to 3 team members', included: true },
        { text: 'Priority support', included: true },
        { text: 'API access (rate-limited)', included: true },
        { text: 'White-label branding', included: false }
      ],
      buttonText: 'Upgrade to Pro',
      buttonAction: () => handlePlanSelect(
        billingCycle === 'monthly' ? 'PRO_MONTHLY' : 'PRO_YEARLY',
        'Pro',
        billingCycle === 'monthly' ? 349 : 2999
      ),
      disabled: isLoading
    },
    {
      name: 'Business',
      description: 'Perfect for teams and growing companies',
      monthlyPrice: 699,
      yearlyPrice: 5999,
      popular: false,
      features: [
        { text: 'Unlimited short links', included: true },
        { text: 'Unlimited QR codes', included: true },
        { text: '200 file-to-link conversions per month', included: true },
        { text: 'Full analytics (geo/device/referrer)', included: true },
        { text: '3 custom domains', included: true },
        { text: 'Up to 10 team members', included: true },
        { text: 'VIP support', included: true },
        { text: 'Unlimited API access', included: true },
        { text: 'White-label branding', included: true },
        { text: '99.9% uptime SLA', included: true }
      ],
      buttonText: 'Upgrade to Business',
      buttonAction: () => handlePlanSelect(
        billingCycle === 'monthly' ? 'BUSINESS_MONTHLY' : 'BUSINESS_YEARLY',
        'Business',
        billingCycle === 'monthly' ? 699 : 5999
      ),
      disabled: isLoading
    }
  ];

  return (
    <div className="py-12">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-12">
        <div className="bg-gray-100 p-1 rounded-xl flex items-center">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all relative ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save 30%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
              plan.popular 
                ? 'border-blue-500 transform scale-105' 
                : 'border-gray-200 hover:border-gray-300'
            } transition-all duration-300`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular 🔥
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-gray-600">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
                {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    Save ₹{(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                  </div>
                )}
              </div>

              <button
                onClick={plan.buttonAction}
                disabled={plan.disabled}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  plan.name === 'Free'
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    : plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.disabled ? 'Processing...' : plan.buttonText}
              </button>
            </div>

            <div className="space-y-4">
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    feature.included ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16 max-w-6xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Detailed Feature Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                <th className="text-center py-4 px-6 font-semibold text-blue-600">Pro</th>
                <th className="text-center py-4 px-6 font-semibold text-purple-600">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { feature: "Short Links", free: "75/month", pro: "Unlimited", business: "Unlimited" },
                { feature: "QR Codes", free: "30/month", pro: "Unlimited", business: "Unlimited" },
                { feature: "File-to-Link", free: "5/month", pro: "50/month", business: "200/month" },
                { feature: "Analytics", free: "Basic", pro: "Advanced", business: "Full (geo/device/referrer)" },
                { feature: "Custom Domains", free: "❌", pro: "1", business: "3" },
                { feature: "Team Members", free: "1", pro: "3", business: "10" },
                { feature: "API Access", free: "❌", pro: "✅ (rate-limited)", business: "✅ Unlimited" },
                { feature: "Support", free: "Community", pro: "Priority", business: "VIP" },
                { feature: "White-label", free: "❌", pro: "❌", business: "✅" },
                { feature: "SLA", free: "❌", pro: "❌", business: "99.9%" }
              ].map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                  <td className="py-4 px-6 text-center text-gray-600">{row.free}</td>
                  <td className="py-4 px-6 text-center text-blue-600 font-medium">{row.pro}</td>
                  <td className="py-4 px-6 text-center text-purple-600 font-medium">{row.business}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewPricingPlans;