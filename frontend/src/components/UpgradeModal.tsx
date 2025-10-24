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

            {/* Simplified Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white shadow-2xl rounded-2xl mx-4"
            >
              <div className="p-6">
                {/* Simple Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                      <Crown className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Upgrade Required</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Simple message */}
                <div className="mb-6 text-center">
                  <p className="text-gray-600 mb-4">
                    {message || 'This feature requires a Premium subscription.'}
                  </p>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {/* Monthly Plan */}
                  <div className={`relative p-4 sm:p-6 border-2 rounded-xl transition-all ${
                    selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div className="text-center">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Premium Monthly</h4>
                      <div className="mb-4">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{pricing.monthly.price}</span>
                        <span className="text-sm sm:text-base text-gray-600">/month</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade('PREMIUM_MONTHLY')}
                        disabled={isLoading}
                        className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold transition-all ${
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
                  <div className={`relative p-4 sm:p-6 border-2 rounded-xl transition-all ${
                    selectedPlan === 'yearly' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                        Best Value 💎
                      </span>
                    </div>
                    <div className="text-center pt-2">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Premium Yearly</h4>
                      <div className="mb-2">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{pricing.yearly.price}</span>
                        <span className="text-sm sm:text-base text-gray-600">/year</span>
                      </div>
                      <div className="mb-4">
                        <span className="text-xs sm:text-sm text-green-600 font-medium">Save ₹{pricing.yearly.savings} per year</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade('PREMIUM_YEARLY')}
                        disabled={isLoading}
                        className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold transition-all ${
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
                  <div className={`relative p-4 sm:p-6 border-2 rounded-xl transition-all ${
                    selectedPlan === 'lifetime' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                  }`}>
                    <div className="text-center">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Lifetime</h4>
                      <div className="mb-2">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{pricing.lifetime.price}</span>
                      </div>
                      <div className="mb-4">
                        <span className="text-xs sm:text-sm text-orange-600 font-medium">Pay once, use forever</span>
                      </div>
                      <button
                        onClick={() => handleUpgrade('LIFETIME')}
                        disabled={isLoading}
                        className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-semibold transition-all ${
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
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 text-center">
                    What you get with Premium
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Unlimited URLs & QR codes</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Custom QR codes with logos</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Custom aliases & domains</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Password protection</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Link expiration dates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Detailed analytics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">500MB file uploads</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700">Priority support</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                  <p className="px-2">Secure payment powered by Razorpay • Cancel anytime • 30-day money-back guarantee</p>
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