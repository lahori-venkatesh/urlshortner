import React, { useState, useEffect } from 'react';
import { Link, ExternalLink, BarChart3, FileImage, QrCode, Shield, Users, Zap, Target, Globe, ArrowRight, Check, Star, Menu, X, Copy, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import LandingPageShortener from '../components/LandingPageShortener';
import Footer from '../components/Footer';


const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'url' | 'qr' | 'file'>('url');
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);



  const handleQuickShorten = async () => {
    if (activeTab === 'url' && !urlInput.trim()) return;
    if (activeTab === 'qr' && !qrText.trim()) return;
    if (activeTab === 'file' && !selectedFile) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const shortCode = Math.random().toString(36).substr(2, 6);
      const baseUrl = process.env.REACT_APP_SHORT_URL_DOMAIN || window.location.origin;
      setShortenedUrl(`${baseUrl}/${shortCode}`);
      setIsLoading(false);
    }, 1500);
  };

  const handleFileToLink = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    // Redirect to dashboard after successful login/signup
    navigate('/dashboard');
  };

  const handleSignupPrompt = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const { toast } = await import('react-hot-toast');
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const { toast } = await import('react-hot-toast');
      toast.success('Link copied to clipboard!');
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pebly
                </span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Pricing
                </button>
                <a href="#about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  Sign Up Free
                </button>
              </div>
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600 p-2"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-blue-600">Features</a>
              <button 
                onClick={() => {
                  navigate('/pricing');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Pricing
              </button>
              <a href="#about" className="block px-3 py-2 text-gray-700 hover:text-blue-600">About</a>
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
              variants={fadeInUp}
            >
              Shorten. Share. Analyze.{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smarter than Ever.
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4"
              variants={fadeInUp}
            >
              A next-gen URL shortener with advanced analytics, file-to-link conversion, QR codes & more. 
              Free forever for individuals, power-packed for businesses.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4"
              variants={fadeInUp}
            >
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                Get Started for Free
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all">
                Try Demo
              </button>
            </motion.div>

            {/* Quick Shortener with Tabs */}
            <motion.div variants={fadeInUp}>
              <LandingPageShortener onSignupPrompt={handleSignupPrompt} />
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className="relative px-4"
              variants={fadeInUp}
            >
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mx-auto max-w-4xl">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
                  <div className="bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm w-full sm:w-auto text-center sm:text-left">
                    <span className="hidden sm:inline">https://very-long-url-example.com/path/to/resource?param=value</span>
                    <span className="sm:hidden">https://very-long-url.com/...</span>
                  </div>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transform rotate-90 sm:rotate-0" />
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg shadow-sm w-full sm:w-auto text-center">
                    pebly.vercel.app/abc123
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage links
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features that make link management simple, secure, and insightful
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: <Link className="w-8 h-8" />,
                title: "Smart Link Shortening",
                description: "Custom, branded, and password-protected links with advanced customization options."
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Analytics Dashboard",
                description: "Track clicks, geo-location, devices, and time with detailed insights and reports."
              },
              {
                icon: <FileImage className="w-8 h-8" />,
                title: "File to Link",
                description: "Convert images, PDFs, and documents into shareable links instantly."
              },
              {
                icon: <QrCode className="w-8 h-8" />,
                title: "QR Code Generator",
                description: "Instantly create scannable QR codes for your links with customizable designs."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                variants={fadeInUp}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>  
    {/* Advanced Features Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced Features That Set Us Apart
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade tools for businesses, marketers, and power users
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                icon: <Target className="w-6 h-6" />,
                title: "AI-based Link Recommendations",
                description: "Get smart suggestions for keywords, tags, and custom domains to maximize your link performance."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Bulk Link Shortening",
                description: "Process hundreds of URLs at once with our powerful bulk shortening tool for businesses."
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Team Collaboration",
                description: "Manage links, campaigns, and roles with your team. Perfect for agencies and enterprises."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Advanced Security",
                description: "Password protection, expiration dates, one-time clicks, and enterprise-grade security."
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Custom Domains",
                description: "Use your own branded domains to build trust and maintain brand consistency."
              },
              {
                icon: <ExternalLink className="w-6 h-6" />,
                title: "Powerful Integrations",
                description: "Connect with WhatsApp, Slack, Gmail, Google Docs, and 50+ other platforms via API."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                variants={fadeInUp}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Pebly Over Competitors?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                We're not just another URL shortener. We're built specifically for the modern web with features that actually matter.
              </p>
              
              <div className="space-y-4">
                {[
                  "Free advanced analytics (others charge $29+/month)",
                  "File-to-link conversion (completely unique feature)",
                  "Ad-supported free tier (sustainable and generous)",
                  "Built for Indian market with local insights",
                  "Team collaboration at affordable prices",
                  "99.9% uptime with global CDN"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-green-100 p-1 rounded-full">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Perfect for:</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "🎓 Students & Professionals",
                  "🏢 Small Businesses", 
                  "🚀 Startups & Scale-ups",
                  "👨‍💻 Developers & Agencies",
                  "📱 Social Media Managers",
                  "📊 Digital Marketers"
                ].map((user, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                    {user}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Growing Companies
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of businesses already using Pebly
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                quote: "Best link management tool for Indian startups. The analytics are incredibly detailed and the file-to-link feature is a game changer.",
                author: "Priya Sharma",
                role: "Marketing Director, TechStart",
                rating: 5
              },
              {
                quote: "We switched from Bitly and saved 70% on costs while getting better features. The team collaboration tools are excellent.",
                author: "Rahul Gupta",
                role: "Growth Manager, ScaleUp Inc",
                rating: 5
              },
              {
                quote: "The bulk shortening feature processes our 1000+ URLs in seconds. Customer support is responsive and helpful.",
                author: "Anjali Patel",
                role: "Digital Marketing Lead, GrowthCo",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-lg"
                variants={fadeInUp}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Company Logos */}
          <motion.div 
            className="text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <p className="text-gray-600 mb-8">Trusted by innovative companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {['TechStart', 'ScaleUp Inc', 'GrowthCo', 'InnovateLab', 'NextGen Solutions', 'FutureWorks'].map((company, index) => (
                <div key={index} className="bg-gray-100 px-6 py-3 rounded-lg">
                  <span className="text-gray-700 font-semibold">{company}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Start shortening smarter today!
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses and individuals who trust Pebly for their link management needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                Create Free Account
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all">
                View Live Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />

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

export default LandingPage;