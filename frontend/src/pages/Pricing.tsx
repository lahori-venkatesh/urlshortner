import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Crown, Zap, ChevronDown, HelpCircle, Star, Tag, Percent, Infinity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import PaymentModal from '../components/PaymentModal';

import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { subscriptionService, PricingData } from '../services/subscriptionService';
import toast from 'react-hot-toast';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    type: 'PRO_MONTHLY' | 'PRO_YEARLY' | 'BUSINESS_MONTHLY' | 'BUSINESS_YEARLY';
    name: string;
    price: number;
  } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null>(null);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    loadPricingData();
    if (isAuthenticated) {
      loadSubscriptionStatus();
    }
  }, [isAuthenticated]);

  const loadPricingData = async () => {
    try {
      const pricing = await subscriptionService.getPricing();
      setPricingData(pricing);
    } catch (error) {
      console.error('Failed to load pricing:', error);
      toast.error('Failed to load pricing information');
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const status = await paymentService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  const handlePlanSelect = async (planType: 'PRO_MONTHLY' | 'PRO_YEARLY' | 'BUSINESS_MONTHLY' | 'BUSINESS_YEARLY', planName: string, price: number) => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    if (!user?.id) {
      toast.error('Please log in to upgrade');
      return;
    }

    setIsLoading(true);
    try {
      const subscriptionPlanType = planType;
      
      await subscriptionService.initializePayment(subscriptionPlanType, user.id);
      toast.success('Payment successful! Your plan has been upgraded.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Welcome to Pebly Premium! 🎉');
    loadSubscriptionStatus();
    navigate('/dashboard');
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setCouponError('');
      
      // Check for the special 99% discount coupon
      if (couponCode.toLowerCase() === 'venkat99') {
        setAppliedCoupon({
          code: 'VENKAT99',
          discount: 99,
          type: 'percentage'
        });
        toast.success('🎉 Incredible! 99% discount applied!');
        return;
      }

      // Check for the special 90% discount coupon
      if (couponCode.toLowerCase() === 'venakt90') {
        setAppliedCoupon({
          code: 'VENAKT90',
          discount: 90,
          type: 'percentage'
        });
        toast.success('🎉 Amazing! 90% discount applied!');
        return;
      }

      // You can add more coupon validation logic here
      // For now, we'll just handle the special coupons
      setCouponError('Invalid coupon code');
    } catch (error) {
      setCouponError('Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('Coupon removed');
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedCoupon) return originalPrice;
    
    if (appliedCoupon.type === 'percentage') {
      const discountedPrice = originalPrice * (1 - appliedCoupon.discount / 100);
      // Ensure minimum price of ₹1 and round to nearest rupee
      return Math.max(1, Math.round(discountedPrice));
    } else {
      return Math.max(1, originalPrice - appliedCoupon.discount);
    }
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (planType: 'PRO_MONTHLY' | 'PRO_YEARLY' | 'BUSINESS_MONTHLY' | 'BUSINESS_YEARLY', planName: string, originalPrice: number) => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const res = await initializeRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      const finalPrice = calculateDiscountedPrice(originalPrice);
      
      console.log('Payment Details:', {
        originalPrice,
        finalPrice,
        couponCode: appliedCoupon?.code,
        discount: appliedCoupon?.discount
      });
      
      // Create order on backend
      const apiUrl = process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api';
      const orderResponse = await fetch(`${apiUrl}/v1/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalPrice * 100, // Razorpay expects amount in paise
          currency: 'INR',
          planType,
          planName,
          couponCode: appliedCoupon?.code || null,
          originalAmount: originalPrice * 100,
          discountedAmount: finalPrice * 100,
          userId: 'user-id' // Replace with actual user ID from auth context
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_live_RWtmHyTZfva7rb',
        amount: finalPrice * 100, // Use the calculated final price
        currency: 'INR',
        name: 'Pebly',
        description: `${planName} Subscription${appliedCoupon ? ` (${appliedCoupon.discount}% off)` : ''}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${apiUrl}/v1/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType,
                userId: 'user-id' // Replace with actual user ID
              }),
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              handlePaymentSuccess();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'User Name', // Replace with actual user name
          email: 'user@example.com', // Replace with actual user email
          contact: '9999999999', // Replace with actual user phone
        },
        notes: {
          planType,
          couponCode: appliedCoupon?.code || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "What's the difference between monthly and yearly billing?",
      answer: "Yearly billing gives you 17% savings compared to monthly billing. You get the same features with both options, but yearly subscribers save ₹1,089 annually and get priority support."
    },
    {
      question: "Is the Lifetime Access plan really lifetime?",
      answer: "Yes! Pay once and use Pebly forever. You'll get all current features plus any future updates we release. No recurring payments, no expiration date, guaranteed lifetime access."
    },
    {
      question: "Can I upgrade from Free to Premium anytime?",
      answer: "Absolutely! You can upgrade from Free to Premium or Lifetime Access at any time. Your existing links and data will remain intact, and you'll immediately get access to all premium features with enhanced capabilities."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, UPI payments, net banking, and digital wallets like PayPal, Paytm, PhonePe, and Google Pay. All transactions are secured with bank-level encryption."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team and we'll process your refund within 3-5 business days."
    },
    {
      question: "How does team collaboration work?",
      answer: "Premium plans include up to 5 team members, while Lifetime Access includes unlimited team members. You can invite teammates, assign roles, and collaborate on link management and analytics in real-time."
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const faqStaggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const faqFadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Pricing Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Dashboard */}
          <div className="mb-8">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>

          <motion.div 
            className="text-center mb-12"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Start free and scale as you grow. Transparent pricing with no hidden fees.
            </p>
            
            {/* Simple Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  17% off
                </span>
              </button>
            </div>
          </motion.div>

          {/* Coupon Section */}
          <motion.div 
            className="max-w-md mx-auto mb-8"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-center mb-4">
                <Tag className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Have a Coupon Code?</h3>
              </div>
              
              {!appliedCoupon ? (
                <div className="space-y-3">
                  {!showCouponInput ? (
                    <button
                      onClick={() => setShowCouponInput(true)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Percent className="w-4 h-4" />
                      <span>Apply Coupon Code</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          placeholder="Enter coupon code (e.g., VENKAT99, VENAKT90)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          onClick={applyCoupon}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-600 text-sm">{couponError}</p>
                      )}
                      <button
                        onClick={() => {
                          setShowCouponInput(false);
                          setCouponCode('');
                          setCouponError('');
                        }}
                        className="text-gray-600 text-sm hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-100 rounded-lg p-4 border border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Coupon Applied!</p>
                        <p className="text-sm text-green-700">
                          {appliedCoupon.code} - {appliedCoupon.discount}% OFF
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  💡 Try codes <span className="font-mono bg-yellow-100 px-2 py-1 rounded text-yellow-800">VENKAT99</span> for 99% off or <span className="font-mono bg-yellow-100 px-2 py-1 rounded text-yellow-800">VENAKT90</span> for 90% off!
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Free Plan */}
            <motion.div 
              className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
              variants={fadeInUp}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">₹0</div>
                <p className="text-gray-600 text-sm">Perfect to get started</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "75 short links per month",
                  "30 QR codes per month", 
                  "5 file conversions per month",
                  "Basic analytics",
                  "Community support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                {isAuthenticated ? 'Current Plan' : 'Get Started Free'}
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              className="bg-blue-600 rounded-xl shadow-lg p-6 relative transform scale-105 border-2 border-blue-500"
              variants={fadeInUp}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Most Popular</span>
                </span>
              </div>
              
              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white mb-1">
                    ₹{billingCycle === 'monthly' ? '349' : '2,999'}
                  </div>
                </div>
                <p className="text-blue-100 text-sm">
                  per {billingCycle === 'monthly' ? 'month' : 'year'}
                </p>
                {billingCycle === 'yearly' && (
                  <p className="text-yellow-300 font-medium mt-1 text-sm">
                    Save ₹1,189 annually
                  </p>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited short links",
                  "Unlimited QR codes",
                  "50 file conversions per month",
                  "Advanced analytics",
                  "1 custom domain",
                  "Up to 3 team members",
                  "Priority support",
                  "API access"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Upgrade to Pro
              </button>
            </motion.div>

            {/* Business Plan */}
            <motion.div 
              className="bg-purple-600 rounded-xl shadow-md p-6 border border-purple-500 hover:shadow-lg transition-all duration-300 relative"
              variants={fadeInUp}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  For Teams
                </span>
              </div>
              
              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Business</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white mb-1">
                    ₹{billingCycle === 'monthly' ? '699' : '5,999'}
                  </div>
                </div>
                <p className="text-purple-100 text-sm">
                  per {billingCycle === 'monthly' ? 'month' : 'year'}
                </p>
                {billingCycle === 'yearly' && (
                  <p className="text-yellow-300 font-medium mt-1 text-sm">
                    Save ₹2,389 annually
                  </p>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Everything in Pro",
                  "200 file conversions per month",
                  "3 custom domains",
                  "Up to 10 team members",
                  "White-label branding",
                  "VIP support",
                  "99.9% SLA guarantee",
                  "Advanced API features"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Upgrade to Business
              </button>
            </motion.div>
          </motion.div>

          {/* Feature Comparison Table */}
          <motion.div 
            className="mt-16 bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-200"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Compare Plans
              </h3>
              <p className="text-gray-600">
                See what's included in each plan
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                    <th className="text-center py-4 px-6 font-semibold text-blue-600">Pro</th>
                    <th className="text-center py-4 px-6 font-semibold text-purple-600">Business</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { feature: "Short links per month", free: "75", pro: "Unlimited", business: "Unlimited" },
                    { feature: "QR codes per month", free: "30", pro: "Unlimited", business: "Unlimited" },
                    { feature: "File conversions per month", free: "5", pro: "50", business: "200" },
                    { feature: "Basic analytics", free: "✓", pro: "✓", business: "✓" },
                    { feature: "Advanced analytics", free: "✗", pro: "✓", business: "✓" },
                    { feature: "Custom domains", free: "✗", pro: "1", business: "3" },
                    { feature: "Team members", free: "1", pro: "3", business: "10" },
                    { feature: "API access", free: "✗", pro: "✓", business: "✓" },
                    { feature: "Priority support", free: "✗", pro: "✓", business: "VIP" },
                    { feature: "White-label branding", free: "✗", pro: "✗", business: "✓" },
                    { feature: "SLA guarantee", free: "✗", pro: "✗", business: "99.9%" }
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
          </motion.div>

          {/* FAQ Section */}
          <motion.div 
            className="mt-16 bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-200"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Frequently Asked Questions
              </h3>
              <p className="text-gray-600">
                Got questions? We've got answers.
              </p>
            </div>

            <motion.div 
              className="max-w-4xl mx-auto space-y-4"
              variants={faqStaggerContainer}
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
                  variants={faqFadeInUp}
                  whileHover={{ scale: 1.01 }}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group"
                  >
                    <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors duration-200">
                      {faq.question}
                    </h4>
                    <motion.div
                      animate={{ rotate: openFAQ === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 ml-4"
                    >
                      <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openFAQ === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-2">
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4"></div>
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

            {/* Call to Action */}
            <motion.div 
              className="mt-8 text-center p-4 bg-gray-50 rounded-lg"
              variants={faqFadeInUp}
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Still have questions?
              </h4>
              <p className="text-gray-600 mb-3">
                Our support team is here to help
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
            </motion.div>
          </motion.div>

          {/* Policy Links for Razorpay Compliance */}
          <motion.div 
            className="mt-12 text-center"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <p className="text-gray-600 mb-4">
                By proceeding with payment, you agree to our policies:
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">Terms & Conditions</a>
                <span className="text-gray-400">•</span>
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>
                <span className="text-gray-400">•</span>
                <a href="/cancellation-refund" className="text-blue-600 hover:text-blue-800 underline">Refund Policy</a>
                <span className="text-gray-400">•</span>
                <a href="/shipping-policy" className="text-blue-600 hover:text-blue-800 underline">Shipping Policy</a>
                <span className="text-gray-400">•</span>
                <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">Contact Us</a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          planType={selectedPlan.type}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default Pricing;