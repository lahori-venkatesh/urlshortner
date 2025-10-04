import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Crown, Zap, ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../components/AuthModal';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleAuthSuccess = () => {
    
    navigate('/dashboard');
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences. Your data and settings remain intact during plan transitions."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), UPI payments, net banking, digital wallets like PayPal, Paytm, PhonePe, and Google Pay. All transactions are secured with 256-bit SSL encryption."
    },
    {
      question: "Is there a free trial for Premium?",
      answer: "Yes, we offer a 14-day free trial for Premium plans with no credit card required. You'll get full access to all Premium features during the trial period. We'll send you reminders before the trial ends."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied for any reason, contact our support team and we'll process your refund within 3-5 business days."
    },
    {
      question: "How does team collaboration work?",
      answer: "Premium plans include up to 5 team members with role-based permissions. You can invite teammates, assign different access levels (admin, editor, viewer), and collaborate on link management and analytics in real-time."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data remains accessible during your current billing period. After cancellation, we retain your data for 90 days in case you want to reactivate. You can export all your links and analytics data anytime from your dashboard."
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h1 className="text-xl font-semibold text-gray-900">Upgrade Your Plan</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, upgrade when you need more. No hidden fees, no surprises.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Free Plan */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-600 "
              variants={fadeInUp}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₹0</div>
                <p className="text-gray-600">Forever free with ads</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited short links",
                  "Basic analytics",
                  "QR code generation",
                  "File-to-link conversion",
                  "Community support",
                  "Ads on dashboard"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div 
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 border-2 border-blue-600 relative transform scale-105"
              variants={fadeInUp}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-10 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Most Popular</span>
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                <div className="text-4xl font-bold text-white mb-2">₹199</div>
                <p className="text-blue-100">per month</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Free",
                  "Ad-free experience",
                  "Advanced analytics",
                  "Custom branded domains",
                  "Bulk link shortening",
                  "Priority support",
                  "API access",
                  "Team collaboration (5 users)"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-white" />
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Premium Trial
              </button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-600"
              variants={fadeInUp}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">Custom</div>
                <p className="text-gray-600">Tailored for your needs</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Premium",
                  "Unlimited team members",
                  "White-label solution",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantee",
                  "Advanced security",
                  "Custom analytics"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className="w-full border-2 border-blue-600 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-colors">
                Contact Sales
              </button>
            </motion.div>
          </motion.div>

          {/* Enhanced FAQ Section */}
          <motion.div 
            className="mt-20 bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-8 md:p-12 border border-blue-100"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Got questions? We've got answers. Can't find what you're looking for? 
                <button className="text-blue-600 hover:text-blue-700 ml-1 underline">
                  Contact our support team
                </button>
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
              className="mt-12 text-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl"
              variants={faqFadeInUp}
            >
              <h4 className="text-xl font-semibold text-white mb-2">
                Still have questions?
              </h4>
              <p className="text-blue-100 mb-4">
                Our friendly support team is here to help 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Contact Support
                </button>
                <button className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
                  Schedule a Demo
                </button>
              </div>
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
    </div>
  );
};

export default Pricing;