import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Crown, Zap, ChevronDown, HelpCircle, Infinity, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/AuthModal';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import toast from 'react-hot-toast';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    type: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
    name: string;
    price: number;
  } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (isAuthenticated) {
      loadSubscriptionStatus();
    }
  }, [isAuthenticated]);

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

  const handlePlanSelect = (planType: 'MONTHLY' | 'YEARLY' | 'LIFETIME', planName: string, price: number) => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    setSelectedPlan({ type: planType, name: planName, price });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('Welcome to Pebly Premium! 🎉');
    loadSubscriptionStatus();
    navigate('/dashboard');
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
      answer: "Absolutely! You can upgrade from Free to Premium or Lifetime Access at any time. Your existing links and data will remain intact, and you'll immediately get access to all premium features."
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
                  <Star className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">₹0</div>
                <p className="text-gray-600 text-sm">Perfect to get started</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "5 short links/month",
                  "Basic analytics",
                  "QR code generation",
                  "File-to-link conversion",
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

            {/* Premium Plan */}
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
                <h3 className="text-xl font-semibold text-white mb-2">Premium</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  ₹{billingCycle === 'monthly' ? '299' : '2,499'}
                </div>
                <p className="text-blue-100 text-sm">
                  per {billingCycle === 'monthly' ? 'month' : 'year'}
                </p>
                {billingCycle === 'yearly' && (
                  <p className="text-yellow-300 font-medium mt-1 text-sm">
                    Save ₹1,089 annually
                  </p>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited short links",
                  "Advanced analytics",
                  "Custom branded domains",
                  "Bulk link management",
                  "Priority support",
                  "Team collaboration (5 users)",
                  "Ad-free experience"
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
                onClick={() => handlePlanSelect(
                  billingCycle === 'monthly' ? 'MONTHLY' : 'YEARLY', 
                  `Premium ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`, 
                  billingCycle === 'monthly' ? 299 : 2499
                )}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={subscriptionStatus?.hasActiveSubscription}
              >
                {subscriptionStatus?.hasActiveSubscription ? 'Current Plan' : `Choose ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`}
              </button>
            </motion.div>

            {/* Lifetime Plan */}
            <motion.div 
              className="bg-purple-600 rounded-xl shadow-md p-6 border border-purple-500 hover:shadow-lg transition-all duration-300 relative"
              variants={fadeInUp}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  Best Value
                </span>
              </div>
              
              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Infinity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Lifetime Access</h3>
                <div className="text-3xl font-bold text-white mb-1">₹9,999</div>
                <p className="text-purple-100 text-sm">one-time payment</p>
                <p className="text-yellow-300 font-medium mt-1 text-sm">Never pay again!</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Everything in Premium",
                  "Lifetime access guarantee",
                  "All future updates included",
                  "White-label solution",
                  "Unlimited team members",
                  "VIP support channel",
                  "Early access to new features"
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
                onClick={() => handlePlanSelect('LIFETIME', 'Lifetime Access', 9999)}
                className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={subscriptionStatus?.hasActiveSubscription}
              >
                {subscriptionStatus?.hasActiveSubscription ? 'Ultimate Upgrade' : 'Get Lifetime Access'}
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
                    <th className="text-center py-4 px-6 font-semibold text-blue-600">Premium</th>
                    <th className="text-center py-4 px-6 font-semibold text-purple-600">Lifetime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { feature: "Short links per month", free: "5", premium: "Unlimited", lifetime: "Unlimited" },
                    { feature: "QR code generation", free: "✓", premium: "✓", lifetime: "✓" },
                    { feature: "Basic analytics", free: "✓", premium: "✓", lifetime: "✓" },
                    { feature: "Advanced analytics", free: "✗", premium: "✓", lifetime: "✓" },
                    { feature: "Custom domains", free: "✗", premium: "✓", lifetime: "✓" },
                    { feature: "Team members", free: "1", premium: "5", lifetime: "Unlimited" },
                    { feature: "API access", free: "✗", premium: "✗", lifetime: "✓" },
                    { feature: "Priority support", free: "✗", premium: "✓", lifetime: "VIP" },
                    { feature: "White-label solution", free: "✗", premium: "✗", lifetime: "✓" }
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-gray-600">{row.free}</td>
                      <td className="py-4 px-6 text-center text-blue-600 font-medium">{row.premium}</td>
                      <td className="py-4 px-6 text-center text-purple-600 font-medium">{row.lifetime}</td>
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