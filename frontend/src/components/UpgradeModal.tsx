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
  showOnlyBusiness?: boolean; // New prop to show only business plan
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature, message, showOnlyBusiness = false }) => {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isYearly, setIsYearly] = useState(true);
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
                      <p className="text-sm text-gray-600">Unlock Pro features</p>
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
                    {message || 'This feature requires a Pro subscription.'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Choose a plan that works best for you
                  </p>
                </div>

                {/* Plan Toggle */}
                <div className="flex items-center justify-center mb-8">
                  <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                    <button
                      onClick={() => setIsYearly(false)}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        !isYearly
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setIsYearly(true)}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-all relative ${
                        isYearly
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Yearly
                      {isYearly && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                          Save 20%
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pricing cards */}
                <div className={`grid grid-cols-1 ${showOnlyBusiness ? '' : 'md:grid-cols-2'} gap-6 lg:gap-8 mb-8`}>
                  {/* Pro Plan - Only show if not showOnlyBusiness */}
                  {!showOnlyBusiness && (
                    <div className="relative p-8 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl transition-all hover:shadow-xl">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                          {isYearly ? 'Best Value 💎' : 'Most Popular 🔥'}
                        </span>
                      </div>
                      <div className="text-center pt-2">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">
                          Pro {isYearly ? 'Yearly' : 'Monthly'}
                        </h4>
                        <div className="mb-2">
                          <span className="text-4xl font-bold text-gray-900">
                            ₹{isYearly ? '2,999' : '349'}
                          </span>
                          <span className="text-lg text-gray-600">
                            /{isYearly ? 'year' : 'month'}
                          </span>
                        </div>
                        {isYearly && (
                          <div className="mb-6">
                            <span className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                              Save ₹1,189 per year
                            </span>
                          </div>
                        )}
                        {!isYearly && <div className="mb-6"></div>}
                        <button
                          onClick={() => handleUpgrade(isYearly ? 'PRO_YEARLY' : 'PRO_MONTHLY')}
                          disabled={isLoading}
                          className="w-full py-4 px-6 rounded-xl text-lg font-bold transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 shadow-lg hover:shadow-xl"
                        >
                          {isLoading ? 'Processing Payment...' : `Upgrade to Pro - ₹${isYearly ? '2,999' : '349'}`}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Business Plan */}
                  <div className="relative p-8 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl transition-all hover:shadow-xl">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                        For Teams 🚀
                      </span>
                    </div>
                    <div className="text-center pt-2">
                      <h4 className="text-xl font-bold text-gray-900 mb-4">
                        Business {isYearly ? 'Yearly' : 'Monthly'}
                      </h4>
                      <div className="mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          ₹{isYearly ? '5,999' : '699'}
                        </span>
                        <span className="text-lg text-gray-600">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </div>
                      {isYearly && (
                        <div className="mb-6">
                          <span className="text-sm text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                            Save ₹2,389 per year
                          </span>
                        </div>
                      )}
                      {!isYearly && <div className="mb-6"></div>}
                      <button
                        onClick={() => handleUpgrade(isYearly ? 'BUSINESS_YEARLY' : 'BUSINESS_MONTHLY')}
                        disabled={isLoading}
                        className="w-full py-4 px-6 rounded-xl text-lg font-bold transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 shadow-lg hover:shadow-xl"
                      >
                        {isLoading ? 'Processing Payment...' : `Upgrade to Business - ₹${isYearly ? '5,999' : '699'}`}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features comparison */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 text-center">
                    What you get with Pro & Business Plans
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Zap className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Unlimited URLs & QR codes</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Palette className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Advanced analytics</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Globe className="w-5 h-5 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Custom domains</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Team collaboration</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <Clock className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">API access</span>
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