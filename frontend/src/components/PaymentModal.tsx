import React, { useState, useEffect } from 'react';
import { X, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { paymentService, PaymentRequest } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: 'PRO_MONTHLY' | 'PRO_YEARLY' | 'BUSINESS_MONTHLY' | 'BUSINESS_YEARLY';
  planName: string;
  planPrice: number;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planType,
  planName,
  planPrice,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Prefill user information when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [isOpen, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment order
      const paymentRequest: PaymentRequest = {
        planType,
        email: formData.email,
        name: formData.name,
        phone: formData.phone
      };

      const paymentResponse = await paymentService.createPaymentOrder(paymentRequest);
      
      // Initiate Razorpay payment
      await paymentService.initiateRazorpayPayment(paymentResponse);
      
      toast.success('Payment successful! Welcome to TinySlash Pro!');
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
            <p className="text-sm text-gray-600 mt-1">{planName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{planName}</h3>
              <p className="text-sm text-gray-600">
                {(planType === 'PRO_MONTHLY' || planType === 'BUSINESS_MONTHLY') && 'Billed monthly'}
                {(planType === 'PRO_YEARLY' || planType === 'BUSINESS_YEARLY') && 'Billed annually'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₹{planPrice}</div>
              {(planType === 'PRO_YEARLY' || planType === 'BUSINESS_YEARLY') && (
                <div className="text-sm text-green-600 font-medium">Save 30%</div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your phone number"
              required
            />
          </div>

          {/* Security Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Secure Payment</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your payment is secured with 256-bit SSL encryption. We support UPI, cards, net banking, and wallets.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Accepted Payment Methods</h4>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <CreditCard className="w-4 h-4" />
                <span>Cards</span>
              </span>
              <span>UPI</span>
              <span>Net Banking</span>
              <span>Wallets</span>
            </div>
          </div>

          {/* Features Included */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">What's Included</h4>
            <div className="space-y-2">
              {[
                'Ad-free experience',
                'Advanced analytics',
                'Custom domains',
                'Priority support',
                'API access'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Pay ₹{planPrice}</span>
              </>
            )}
          </button>

          {/* Policy Links for Razorpay Compliance */}
          <div className="text-xs text-gray-500 text-center space-y-2">
            <p>
              By proceeding, you agree to our{' '}
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms & Conditions</a>,{' '}
              <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>,{' '}
              <a href="/cancellation-refund" target="_blank" className="text-blue-600 hover:underline">Refund Policy</a>, and{' '}
              <a href="/shipping-policy" target="_blank" className="text-blue-600 hover:underline">Shipping Policy</a>.
            </p>
            <p>
              You can cancel anytime from your account settings. For support, visit our{' '}
              <a href="/contact" target="_blank" className="text-blue-600 hover:underline">Contact Page</a>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;