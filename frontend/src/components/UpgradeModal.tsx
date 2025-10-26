import React, { useState, useEffect } from 'react';
import { X, Crown, Zap, Shield, BarChart3, Palette, Globe, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscriptionService, PricingData } from '../services/subscriptionService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  message?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature, message }) => {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPricing();
    }
  }, [isOpen]);

  const loadPricing = async () => {
    try {
      const pricingData = await subscriptionService.getPricing();
      setPricing(pricingData);
    } catch (error) {
      console.error('Failed to load pricing:', error);
      toast.error('Failed to load pricing information');
    }
  };

  const handleUpgrade = async (planType: string) => {
    if (!user?.id) {
      toast.error('Please log in to upgrade');
      return;
    }

    setIsLoading(true);
    try {
      await subscriptionService.initializePayment(planType, user.id);
      toast.success('Payment successful! Your plan has been upgraded.');
      onClose();
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'custom-alias':
        return <Globe className="w-5 h-5" />;
      case 'password-protection':
        return <Shield className="w-5 h-5" />;
      case 'expiration':
        return <Clock className="w-5 h-5" />;
      case 'detailed-analytics':
        return <BarChart3 className="w-5 h-5" />;
      case 'customize-qr':
        return <Palette className="w-5 h-5" />;
      default:
        return <Crown className="w-5 h-5" />;
    }
  };

  if (!pricing) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            {/* Improved Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl mx-4"
            >
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Upgrade Required</h3>
                      <p className="text-sm text-gray-600">Unlock premium features</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Enhanced message */}
                <div className="mb-8 text-center">
                  <p className="text-lg text-gray-600 mb-2">
                    {message || 'This feature requires a Premium subscription.'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Choose a plan that works best for you
                  </p>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                  {/* Monthly Plan */}
                  <div className={`relative p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                    selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Premium Monthly</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">₹{pricing.monthly.price}</span>
                        <span className="text-base text-gray-600">/month</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade('PREMIUM_MONTHLY')}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                          selectedPlan === 'monthly'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {isLoading ? 'Processing...' : 'Choose Monthly'}
                      </button>
                    </div>
                  </div>

                  {/* Yearly Plan */}
                  <div className={`relative p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                    selectedPlan === 'yearly' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                        Best Value 💎
                      </span>
                    </div>
                    <div className="text-center pt-3">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Premium Yearly</h4>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">₹{pricing.yearly.price}</span>
                        <span className="text-base text-gray-600">/year</span>
                      </div>
                      <div className="mb-4">
                        <span className="text-sm text-green-600 font-medium">Save ₹{pricing.yearly.savings} per year</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade('PREMIUM_YEARLY')}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                          selectedPlan === 'yearly'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {isLoading ? 'Processing...' : 'Choose Yearly'}
                      </button>
                    </div>
                  </div>

                  {/* Lifetime Plan */}
                  <div className={`relative p-6 border-2 rounded-xl transition-all hover:shadow-lg ${
                    selectedPlan === 'lifetime' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Lifetime</h4>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">₹{pricing.lifetime.price}</span>
                      </div>
                      <div className="mb-4">
                        <span className="text-sm text-orange-600 font-medium">Pay once, use forever</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade('LIFETIME')}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition-all ${
                          selectedPlan === 'lifetime'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {isLoading ? 'Processing...' : 'Choose Lifetime'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features comparison */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                    What you get with Premium
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Unlimited URLs & QR codes</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Palette className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Custom QR codes with logos</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Globe className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Custom aliases & domains</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Password protection</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Link expiration dates</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <BarChart3 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Detailed analytics</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">500MB file uploads</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Crown className="w-5 h-5 text-pink-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Priority support</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  <p>Secure payment powered by Razorpay • Cancel anytime • 30-day money-back guarantee</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;