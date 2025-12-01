import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, Users, Target, Heart, Code, Globe, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TinySlash
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TinySlash</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
              Revolutionizing link management with smart technology and user-centric design
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-8 sm:p-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Born from the need for a better, smarter way to manage links in the digital age
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">The Vision</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  In today's digital world, links are everywhere. But managing them shouldn't be complicated or expensive. 
                  We created TinySlash to democratize link management - making powerful tools accessible to everyone, 
                  from individual creators to growing businesses.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Our mission is simple: provide the most intuitive, feature-rich link management platform 
                  that grows with your needs, without breaking the bank.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                    <div className="text-gray-600">Links Created</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                    <div className="text-gray-600">Happy Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                    <div className="text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Meet Our Founders</h2>
              <p className="text-lg text-gray-600">
                The visionaries behind TinySlash's innovative approach to link management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Founder 1 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Satish Kumar</h3>
                <p className="text-blue-600 font-medium mb-4">Co-Founder & CEO</p>
                <p className="text-gray-600 leading-relaxed">
                  Visionary entrepreneur with 8+ years in tech startups. Passionate about creating 
                  user-centric products that solve real problems. Previously led product teams at 
                  major Indian tech companies.
                </p>
                <div className="flex justify-center space-x-4 mt-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Code className="w-4 h-4" />
                    <span>Product Strategy</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Target className="w-4 h-4" />
                    <span>Business Development</span>
                  </div>
                </div>
              </div>

              {/* Founder 2 */}
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shankar Reddy</h3>
                <p className="text-purple-600 font-medium mb-4">Co-Founder & CTO</p>
                <p className="text-gray-600 leading-relaxed">
                  Full-stack engineer and tech architect with expertise in scalable systems. 
                  Passionate about clean code and innovative solutions. Previously worked at 
                  leading fintech and e-commerce companies.
                </p>
                <div className="flex justify-center space-x-4 mt-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Zap className="w-4 h-4" />
                    <span>System Architecture</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span>Technical Innovation</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
              <p className="text-lg text-gray-600">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">User-First</h3>
                <p className="text-gray-600">
                  Every feature we build starts with understanding our users' needs. 
                  Simple, intuitive, and powerful.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality</h3>
                <p className="text-gray-600">
                  We believe in building products that last. Quality code, reliable infrastructure, 
                  and exceptional user experience.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
                <p className="text-gray-600">
                  We're constantly pushing boundaries with features like file-to-link conversion 
                  and advanced analytics.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-center text-white"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-blue-100 mb-8">
              Join thousands of users who trust TinySlash for their link management needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Free Today
              </Link>
              <Link
                to="/pricing"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;