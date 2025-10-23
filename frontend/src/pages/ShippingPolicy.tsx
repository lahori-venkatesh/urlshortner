import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, Globe, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ShippingPolicy: React.FC = () => {
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
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Policy</h1>
            <p className="text-gray-600">Last updated: October 23, 2025</p>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Digital Service Notice</h3>
                <p className="text-blue-800">
                  Pebly is a digital URL shortening and QR code generation service. We do not ship physical products. 
                  All our services are delivered digitally and are available immediately upon subscription activation.
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Globe className="w-6 h-6 text-blue-600 mr-2" />
                Service Delivery
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  As Pebly provides digital services, there is no physical shipping involved. Our services include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>URL shortening and management</li>
                  <li>QR code generation and customization</li>
                  <li>Analytics and reporting tools</li>
                  <li>File-to-link conversion services</li>
                  <li>Custom domain management</li>
                </ul>
                <p>
                  All services are delivered instantly through our web platform upon successful payment processing and account activation.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 text-green-600 mr-2" />
                Service Activation Timeline
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">Free Plan</h3>
                    <p className="text-green-800">Instant activation upon account registration</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Premium Plans</h3>
                    <p className="text-blue-800">Activated within 5 minutes of successful payment</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">Lifetime Access</h3>
                    <p className="text-purple-800">Activated within 5 minutes of successful payment</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-2">Custom Solutions</h3>
                    <p className="text-orange-800">Setup within 24-48 hours after consultation</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access and Availability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our services are available 24/7 through our web platform at <strong>pebly.com</strong>. 
                  You can access your account and use all features immediately after:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Completing the registration process</li>
                  <li>Verifying your email address</li>
                  <li>Successful payment processing (for paid plans)</li>
                </ul>
                <p>
                  In case of any service activation delays, our support team will be notified automatically 
                  and will resolve the issue within 2 hours during business hours.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Geographic Availability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Pebly services are available globally to users in all countries, with the following considerations:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Global Access:</strong> Our platform is accessible worldwide</li>
                  <li><strong>Payment Processing:</strong> We accept payments from most countries through Razorpay</li>
                  <li><strong>Data Centers:</strong> Our services are hosted on reliable cloud infrastructure for optimal global performance</li>
                  <li><strong>Compliance:</strong> We comply with international data protection and privacy regulations</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Interruptions</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  While we strive for 99.9% uptime, occasional maintenance or technical issues may temporarily 
                  affect service availability:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Planned Maintenance:</strong> Scheduled during low-traffic hours with advance notice</li>
                  <li><strong>Emergency Maintenance:</strong> Performed as needed to ensure service security and stability</li>
                  <li><strong>Status Updates:</strong> Real-time status information available on our status page</li>
                  <li><strong>Compensation:</strong> Service credits may be provided for extended outages as per our SLA</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Support and Assistance</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you experience any issues with service activation or access:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact our support team at <strong>support@pebly.com</strong></li>
                  <li>Use the in-app chat support for immediate assistance</li>
                  <li>Check our help documentation and FAQ section</li>
                  <li>Premium users receive priority support with faster response times</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Export and Portability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  While we don't ship physical products, we do provide data portability options:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Data Export:</strong> Export your links, analytics, and QR codes at any time</li>
                  <li><strong>API Access:</strong> Programmatic access to your data (Lifetime plan)</li>
                  <li><strong>Backup Services:</strong> Regular automated backups of your data</li>
                  <li><strong>Migration Assistance:</strong> Help with data migration if needed</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  For questions about service delivery or access issues:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> support@pebly.com</p>
                  <p><strong>Phone:</strong> +91 9876543210</p>
                  <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM IST</p>
                  <p><strong>Address:</strong> 123 Tech Park, Sector 5, Bangalore, Karnataka 560001, India</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Policy Updates</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This shipping policy may be updated from time to time to reflect changes in our services 
                  or legal requirements. We will notify users of any significant changes through:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email notifications to registered users</li>
                  <li>In-app notifications</li>
                  <li>Updates on our website</li>
                </ul>
                <p>
                  Continued use of our services after policy updates constitutes acceptance of the revised terms.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPolicy;