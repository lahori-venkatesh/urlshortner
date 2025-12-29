import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const TermsAndConditions: React.FC = () => {
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
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
            <p className="text-gray-600">Last updated: October 23, 2025</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Tinyslash ("the Service"), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by the above, please do not
                use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                Tinyslash provides URL shortening, QR code generation, file-to-link conversion, and analytics
                services. We offer free, Pro, and Business subscription plans with varying features and limitations.
              </p>
            </section>
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  To access certain features of the Service, you may be required to create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create links to illegal, harmful, or offensive content</li>
                  <li>Distribute malware, viruses, or other malicious software</li>
                  <li>Engage in phishing, spam, or fraudulent activities</li>
                  <li>Violate intellectual property rights</li>
                  <li>Harass, abuse, or harm others</li>
                  <li>Circumvent security measures or access restrictions</li>
                  <li>Use the service for commercial purposes without proper authorization</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Subscription Plans and Billing</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-900">5.1 Plan Types</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Free Plan:</strong> Limited features with usage restrictions</li>
                  <li><strong>Pro Monthly:</strong> Advanced features billed monthly</li>
                  <li><strong>Pro Yearly:</strong> Advanced features billed annually with discount</li>
                  <li><strong>Business Monthly:</strong> Team features billed monthly</li>
                  <li><strong>Business Yearly:</strong> Team features billed annually with discount</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">5.2 Billing Terms</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Subscription fees are billed in advance</li>
                  <li>All payments are processed through Razorpay</li>
                  <li>Prices are subject to change with 30 days notice</li>
                  <li>No refunds for partial months of service</li>
                  <li>Failed payments may result in service suspension</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  The Service and its original content, features, and functionality are owned by Tinyslash and are
                  protected by international copyright, trademark, patent, trade secret, and other intellectual
                  property laws.
                </p>
                <p>
                  You retain ownership of content you create using our Service, but grant us a license to
                  store, process, and display such content as necessary to provide the Service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Your privacy is important to us. Our Privacy Policy explains how we collect, use, and
                  protect your information when you use our Service. By using our Service, you agree to
                  the collection and use of information in accordance with our Privacy Policy.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We strive to maintain high service availability but do not guarantee uninterrupted access.
                  The Service may be temporarily unavailable due to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Scheduled maintenance</li>
                  <li>Technical difficulties</li>
                  <li>Force majeure events</li>
                  <li>Third-party service disruptions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  To the maximum extent permitted by law, Tinyslash shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages, including but not limited to
                  loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without
                  prior notice, for conduct that we believe violates these Terms or is harmful to other
                  users, us, or third parties.
                </p>
                <p>
                  You may terminate your account at any time by contacting our support team. Upon termination,
                  your right to use the Service will cease immediately.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of India,
                  without regard to its conflict of law provisions. Any disputes arising from these Terms
                  shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of any
                  material changes via email or through the Service. Your continued use of the Service
                  after such modifications constitutes acceptance of the updated Terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@pebly.com</p>
                  <p><strong>Phone:</strong> +91 9876543210</p>
                  <p><strong>Address:</strong> 123 Tech Park, Sector 5, Bangalore, Karnataka 560001, India</p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 text-center">
                By using Pebly, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;