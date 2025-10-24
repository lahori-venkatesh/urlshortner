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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                    {getFeatureIcon(feature || 'upgrade')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h3>
                    <p className="text-gray-600">Unlock powerful features and unlimited access</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Feature message */}
              {message && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">{message}</p>
                </div>
              )}

              {/* Plan selector */}
              <div className="mb-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100 p-1 rounded-lg flex">
                    <button
                      onClick={() => setSelectedPlan('monthly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedPlan === 'monthly'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedPlan('yearly')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                        selectedPlan === 'yearly'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Yearly
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Save ₹1,089
                      </span>
                    </button>
                    <button
                      onClick={() => setSelectedPlan('lifetime')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectedPlan === 'lifetime'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Lifetime
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Monthly Plan */}
                <div className={`relative p-6 border-2 rounded-xl transition-all ${
                  selectedPlan === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Premium Monthly</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">₹{pricing.monthly.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('PREMIUM_MONTHLY')}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
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
                <div className={`relative p-6 border-2 rounded-xl transition-all ${
                  selectedPlan === 'yearly' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Best Value 💎
                    </span>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Premium Yearly</h4>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">₹{pricing.yearly.price}</span>
                      <span className="text-gray-600">/year</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-sm text-green-600 font-medium">Save ₹{pricing.yearly.savings} per year</span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('PREMIUM_YEARLY')}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
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
                <div className={`relative p-6 border-2 rounded-xl transition-all ${
                  selectedPlan === 'lifetime' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                }`}>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Lifetime</h4>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-gray-900">₹{pricing.lifetime.price}</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-sm text-orange-600 font-medium">Pay once, use forever</span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('LIFETIME')}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
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
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  What you get with Premium
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Unlimited URLs & QR codes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">Custom QR codes with logos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Custom aliases & domains</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">Password protection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">Link expiration dates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    <span className="text-gray-700">Detailed analytics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">500MB file uploads</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Crown className="w-5 h-5 text-pink-500" />
                    <span className="text-gray-700">Priority support</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>Secure payment powered by Razorpay • Cancel anytime • 30-day money-back guarantee</p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;