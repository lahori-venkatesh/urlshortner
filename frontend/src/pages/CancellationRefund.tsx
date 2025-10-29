import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const CancellationRefund: React.FC = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="bg-white rounded-xl shadow-md p-8 border border-gray-200"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cancellation & Refund Policy</h1>
            <p className="text-gray-600">Last updated: October 23, 2025</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-6 h-6 text-green-600 mr-2" />
                Refund Eligibility
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We offer a <strong>30-day money-back guarantee</strong> for all paid subscriptions. 
                  You may request a full refund within 30 days of your initial purchase if you are not 
                  satisfied with our service.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">Eligible for Refund:</h3>
                      <ul className="text-green-800 space-y-1">
                        <li>• Pro Monthly subscriptions (within 30 days)</li>
                        <li>• Pro Yearly subscriptions (within 30 days)</li>
                        <li>• Business Monthly subscriptions (within 30 days)</li>
                        <li>• Business Yearly subscriptions (within 30 days)</li>
                        <li>• Accidental duplicate payments</li>
                        <li>• Technical issues preventing service use</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                Non-Refundable Items
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">Not Eligible for Refund:</h3>
                      <ul className="text-red-800 space-y-1">
                        <li>• Refund requests after 30 days from purchase</li>
                        <li>• Partial month refunds for monthly subscriptions</li>
                        <li>• Services used in violation of our Terms of Service</li>
                        <li>• Custom development or consultation services</li>
                        <li>• Third-party service fees (payment processing fees)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cancellation Process</h2>
              <div className="space-y-6 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Subscriptions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancel anytime from your account settings</li>
                  <li>Service continues until the end of current billing period</li>
                  <li>No charges for subsequent months after cancellation</li>
                  <li>Account downgrades to Free plan automatically</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">Yearly Subscriptions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancel anytime from your account settings</li>
                  <li>Service continues until the end of current billing year</li>
                  <li>No automatic renewal after cancellation</li>
                  <li>Prorated refunds available within first 30 days</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">Business Plans</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Monthly or yearly billing cycles available</li>
                  <li>Full refund available within 30 days of purchase</li>
                  <li>Advanced team features and priority support</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Request a Refund</h2>
              <div className="space-y-4 text-gray-700">
                <p>To request a refund, please follow these steps:</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <ol className="list-decimal pl-6 space-y-3 text-blue-800">
                    <li>
                      <strong>Contact Support:</strong> Email us at <strong>support@pebly.com</strong> 
                      with "Refund Request" in the subject line
                    </li>
                    <li>
                      <strong>Provide Information:</strong> Include your account email, order ID, 
                      and reason for refund request
                    </li>
                    <li>
                      <strong>Verification:</strong> We may ask for additional information to verify 
                      your identity and purchase
                    </li>
                    <li>
                      <strong>Processing:</strong> Approved refunds are processed within 3-5 business days
                    </li>
                    <li>
                      <strong>Confirmation:</strong> You'll receive an email confirmation once the 
                      refund is processed
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Refund Processing Timeline</h2>
              <div className="space-y-4 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Review Period</h3>
                    <p className="text-gray-700">1-2 business days for refund approval</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Processing Time</h3>
                    <p className="text-gray-700">3-5 business days after approval</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Bank Processing</h3>
                    <p className="text-gray-700">5-10 business days (varies by bank)</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Total Timeline</h3>
                    <p className="text-gray-700">Up to 15 business days maximum</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prorated Refunds</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For yearly subscriptions cancelled within the first 30 days, we offer prorated refunds:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refund amount = (Unused months / 12) × Annual subscription fee</li>
                  <li>Minimum usage period of 1 month applies</li>
                  <li>Processing fees may be deducted from refund amount</li>
                  <li>Prorated refunds are not available for monthly subscriptions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Status After Cancellation</h2>
              <div className="space-y-4 text-gray-700">
                <p>When you cancel your subscription:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Data Retention:</strong> Your data is preserved for 90 days</li>
                  <li><strong>Feature Access:</strong> Pro features are disabled at period end</li>
                  <li><strong>Free Plan:</strong> Account automatically downgrades to free tier</li>
                  <li><strong>Reactivation:</strong> You can resubscribe anytime to restore full access</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you're not satisfied with our refund decision, you may:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Request escalation to our management team</li>
                  <li>Provide additional documentation supporting your case</li>
                  <li>Contact your payment provider for chargeback assistance</li>
                  <li>Seek resolution through appropriate legal channels</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  For cancellation or refund requests, contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> support@pebly.com</p>
                  <p><strong>Subject Line:</strong> "Cancellation Request" or "Refund Request"</p>
                  <p><strong>Phone:</strong> +91 9876543210</p>
                  <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM IST</p>
                  <p><strong>Response Time:</strong> Within 24 hours for refund requests</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This policy may be updated to reflect changes in our services or legal requirements. 
                  We will notify users of significant changes through email and in-app notifications. 
                  The updated policy will apply to purchases made after the effective date.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CancellationRefund;