import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, ChevronDown, HelpCircle, Star, Tag, Percent, Infinity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import PaymentModal from '../components/PaymentModal';

import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import PublicHeader from '../components/PublicHeader';
import { SEO } from '../components/SEO';
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

  const handlePaymentSuccess = async () => {
    toast.success('Welcome to Pebly Premium! 🎉');

    // Refresh user profile to get updated subscription data
    try {
      if (user?.id) {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api';
        const response = await fetch(`${apiUrl}/v1/auth/refresh-profile/${user.id}`);
        const data = await response.json();

        if (data.success && data.user) {
          // Update localStorage and trigger context refresh
          localStorage.setItem('user', JSON.stringify(data.user));

          window.dispatchEvent(new CustomEvent('auth-user-updated', {
            detail: { user: data.user }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }

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
          userId: user?.id || 'anonymous'
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
                userId: user?.id || 'anonymous'
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Update user context with new subscription data if provided
              if (verifyData.user) {
                const updatedUser = {
                  ...user,
                  plan: verifyData.user.subscriptionPlan || 'free',
                  subscriptionPlan: verifyData.user.subscriptionPlan,
                  subscriptionExpiry: verifyData.user.subscriptionExpiry
                };

                // Update localStorage
                localStorage.setItem('user', JSON.stringify(verifyData.user));

                // Trigger auth context refresh
                window.dispatchEvent(new CustomEvent('auth-user-updated', {
                  detail: { user: updatedUser }
                }));
              }

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
          name: user?.name || 'User',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        notes: {
          planType,
          couponCode: appliedCoupon?.code || '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
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
      <SEO
        title="Pricing"
        description="Simple, transparent pricing for everyone. Start free and scale as you grow. No credit card required."
      />
      {isAuthenticated ? <Header /> : <PublicHeader />}
      {/* Pricing Section */}
      <section className="py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


          <motion.div
            className="text-center mb-16"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Start free and scale as you grow. No hidden fees. Cancel anytime.
            </p>

            {/* Modern Billing Toggle */}
            <div className="flex justify-center mb-12">
              <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex relative">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${billingCycle === 'monthly'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${billingCycle === 'yearly'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Yearly billing
                  <span className={`text-xs px-2 py-0.5 rounded-full ${billingCycle === 'yearly' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                    Save 17%
                  </span>
                </button>
              </div>
            </div>

            {/* Streamlined Coupon Section */}
            <div className="max-w-md mx-auto relative z-10">
              {!appliedCoupon ? (
                !showCouponInput ? (
                  <button
                    onClick={() => setShowCouponInput(true)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 border-b border-dashed border-gray-400 hover:border-gray-900 transition-all pb-0.5"
                  >
                    Have a coupon code?
                  </button>
                ) : (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Enter coupon"
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white/50 backdrop-blur-sm"
                      autoFocus
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setShowCouponInput(false);
                        setCouponCode('');
                        setCouponError('');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                )
              ) : (
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200 text-sm font-medium animate-in fade-in zoom-in duration-200">
                  <Check size={16} />
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied: {appliedCoupon.discount}% OFF</span>
                  <button onClick={removeCoupon} className="ml-2 p-1 hover:bg-green-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}

              {/* Coupon Hint */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  💡 Try codes <span className="font-mono bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-800 font-semibold cursor-pointer hover:bg-yellow-200 transition-colors" onClick={() => { setCouponCode('VENKAT99'); setShowCouponInput(true); }}>VENKAT99</span> or <span className="font-mono bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-800 font-semibold cursor-pointer hover:bg-yellow-200 transition-colors" onClick={() => { setCouponCode('VENAKT90'); setShowCouponInput(true); }}>VENAKT90</span>
                </p>
              </div>
            </div>
          </motion.div>


          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Free Plan */}
            <motion.div
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all duration-300 flex flex-col h-full"
              variants={fadeInUp}
            >
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                  Perfect for individuals and hobbyists starting out with link management.
                </p>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {[
                    "75 natural short links/mo",
                    "30 QR codes/mo",
                    "5 file conversions/mo",
                    "Basic click analytics",
                    "Standard community support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-gray-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="w-full py-4 px-6 rounded-xl border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                {isAuthenticated ? 'Current Plan' : 'Get Started Free'}
              </button>
            </motion.div>

            {/* Pro Plan - Most Popular */}
            <motion.div
              className={`bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-300 flex flex-col h-full relative overflow-hidden transform md:-translate-y-4 md:shadow-xl ${appliedCoupon ? 'ring-2 ring-green-500/50' : ''
                }`}
              variants={fadeInUp}
            >
              {/* Badge */}
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  MOST POPULAR
                </span>
              </div>

              <div className="mb-8 relative z-10">
                <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
                <div className="flex flex-col">
                  {appliedCoupon && (
                    <span className="text-gray-400 line-through text-lg mb-0.5">₹{billingCycle === 'monthly' ? '349' : '2,999'}</span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold tracking-tight ${appliedCoupon ? 'text-green-400' : 'text-white'}`}>
                      ₹{calculateDiscountedPrice(billingCycle === 'monthly' ? 349 : 2999)}
                    </span>
                    <span className="text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billingCycle === 'yearly' && !appliedCoupon && <span className="text-green-400 text-sm mt-2 font-medium">Billed ₹{calculateDiscountedPrice(2999)} yearly</span>}
                </div>
                <p className="text-gray-400 mt-4 text-sm leading-relaxed">
                  For creators and professionals who need advanced tracking and customization.
                </p>
              </div>

              <div className="flex-grow relative z-10">
                <div className="w-full h-px bg-gray-800 mb-8"></div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited short links",
                    "Unlimited QR codes",
                    "50 file conversions/mo",
                    "Advanced analytics dashboard",
                    "1 Custom Domain included",
                    "Up to 3 team members",
                    "Priority email support"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  } else {
                    const originalPrice = billingCycle === 'monthly' ? 349 : 2999;
                    const planType = billingCycle === 'monthly' ? 'PRO_MONTHLY' : 'PRO_YEARLY';
                    const planName = `Pro ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`;
                    handleRazorpayPayment(planType, planName, originalPrice);
                  }
                }}
                className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 relative z-10 shadow-lg ${isProcessingPayment
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-900 hover:bg-blue-50'
                  }`}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Processing...' : 'Upgrade to Pro'}
              </button>

              {/* Background gradient effect */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 flex flex-col h-full"
              variants={fadeInUp}
            >
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Business</h3>
                <div className="flex flex-col">
                  {appliedCoupon && (
                    <span className="text-gray-400 line-through text-lg mb-0.5">₹{billingCycle === 'monthly' ? '699' : '5,999'}</span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold text-gray-900 ${appliedCoupon ? 'text-green-600' : ''}`}>
                      ₹{calculateDiscountedPrice(billingCycle === 'monthly' ? 699 : 5999)}
                    </span>
                    <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                </div>
                <p className="text-gray-500 mt-4 text-sm leading-relaxed">
                  For scaling teams and agencies needing enterprise power and white-labeling.
                </p>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {[
                    "Everything in Pro",
                    "200 file conversions/mo",
                    "3 Custom Domains",
                    "Up to 10 team members",
                    "White-label branding",
                    "Dedicated account manager",
                    "99.9% Uptime SLA"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-purple-600 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  } else {
                    const originalPrice = billingCycle === 'monthly' ? 699 : 5999;
                    const planType = billingCycle === 'monthly' ? 'BUSINESS_MONTHLY' : 'BUSINESS_YEARLY';
                    const planName = `Business ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`;
                    handleRazorpayPayment(planType, planName, originalPrice);
                  }
                }}
                className="w-full py-4 px-6 rounded-xl bg-purple-50 text-purple-700 font-semibold border border-purple-100 hover:bg-purple-100 transition-all duration-200"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Processing...' : 'Upgrade to Business'}
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