import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Link as LinkIcon, ArrowRight, BarChart3, FileImage, QrCode, Shield,
  Users, Zap, Globe, Check, Star, ChevronRight,
  TrendingUp, Lock, Smartphone, Share2, Layers, Plus, Minus, UserCircle
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import LandingPageShortener from '../components/LandingPageShortener';
import TrustedCompanies from '../components/TrustedCompanies';
import Footer from '../components/Footer';
import PublicHeader from '../components/PublicHeader';

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-semibold text-gray-900 text-lg">{question}</span>
        <span className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-gray-600 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<'individual' | 'business'>('individual');

  const handleSignupPrompt = () => {
    setAuthMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 font-sans">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full blur-[100px] opacity-30 mix-blend-multiply animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full blur-[100px] opacity-30 mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full blur-[100px] opacity-30 mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >


            <motion.h1
              variants={fadeIn}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-8 leading-[1.1]"
            >
              Shorten links. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Expand possibilities.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The all-in-one link management platform for modern teams.
              Advanced analytics, custom domains, and QR codes—beautifully simple.
            </motion.p>

            <motion.div variants={fadeIn} className="mb-12">
              <LandingPageShortener onSignupPrompt={handleSignupPrompt} />
            </motion.div>

            <motion.p variants={fadeIn} className="text-sm text-gray-400 font-medium">
              No credit card required · Free plan forever · Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Social Proof - Infinite Scroll */}
      <TrustedCompanies />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in seconds. No complicated setup required.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 border-t-2 border-dashed border-gray-300 z-0"></div>

            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">1</div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <LinkIcon size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Paste & Shorten</h3>
              <p className="text-gray-500 leading-relaxed">
                Enter your long URL into our shortener. We'll instantly generate a short, memorable link for you.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">2</div>
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <Zap size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customize</h3>
              <p className="text-gray-500 leading-relaxed">
                Add a custom alias, set an expiration date, or password-protect your link for extra security.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">3</div>
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <BarChart3 size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Share & Track</h3>
              <p className="text-gray-500 leading-relaxed">
                Share your link anywhere and track clicks, locations, and devices in real-time.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Built for everyone, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                scaled for business.
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
              Whether you're sharing a single file or managing a global brand, we've got you covered.
            </p>

            {/* Toggle */}
            <div className="inline-flex bg-gray-100 p-1.5 rounded-full relative">
              <div className="relative z-10 flex">
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === 'individual' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  For Individuals
                </button>
                <button
                  onClick={() => setActiveTab('business')}
                  className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeTab === 'business' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  For Business
                </button>
              </div>
              <motion.div
                className="absolute top-1.5 bottom-1.5 bg-white rounded-full shadow-sm"
                initial={false}
                animate={{
                  left: activeTab === 'individual' ? '6px' : '50%',
                  width: activeTab === 'individual' ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
                  x: activeTab === 'individual' ? 0 : 0
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            </div>
          </div>

          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'individual' ? (
                <motion.div
                  key="individual"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid lg:grid-cols-2 gap-12 items-center"
                >
                  <div className="order-2 lg:order-1 space-y-8">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Sharing</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Create short links and QR codes in seconds. No complex setup, just paste and share.
                          Perfect for social media bios and messages.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <FileImage size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">File Sharing Made Easy</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Upload images or documents and get a link instantly. Share portfolios, receipts, or memes without clutter.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile Friendly</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Manage everything from your phone. Our responsive dashboard helps you track clicks on the go.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-200 to-pink-200 rounded-[2rem] blur-3xl opacity-30"></div>
                    <div className="relative bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                      {/* Mockup for Individual */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users size={20} className="text-gray-500" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">Personal Dashboard</div>
                            <div className="text-xs text-gray-500">Free Plan</div>
                          </div>
                        </div>
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Active</div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                              <LinkIcon size={18} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">Portfolio Link</div>
                              <div className="text-xs text-blue-600">tinyslash.com/alex-design</div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900">1,240 clicks</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                              <QrCode size={18} />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">WiFi QR Code</div>
                              <div className="text-xs text-blue-600">tinyslash.com/qr/wifi-home</div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900">85 scans</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="business"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid lg:grid-cols-2 gap-12 items-center"
                >
                  <div className="order-2 lg:order-1 space-y-8">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Branded Domains</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Build trust with links that carry your brand name. Replace 'tinyslash.com' with 'link.yourbrand.com'.
                          Increases click-through rates by up to 34%.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <BarChart3 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Understand your audience with detailed insights. Track location, device type, browser,
                          and referrers to optimize your campaigns.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Security</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Keep your data safe with password protection, link expiration, and SSO integration.
                          Designed for teams that prioritize security.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2rem] blur-3xl opacity-20"></div>
                    <div className="relative bg-black rounded-[2rem] shadow-2xl border border-gray-800 p-8 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                      {/* Mockup for Business */}
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <TrendingUp size={20} className="text-blue-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white">Marketing Campaign Q4</div>
                            <div className="text-xs text-gray-400">Business Enterprise</div>
                          </div>
                        </div>
                        <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold">Live</div>
                      </div>
                      <div className="space-y-6">
                        {/* Chart Illustration */}
                        <div className="flex items-end justify-between h-32 gap-2 mb-2">
                          {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                            <div key={i} className="w-full bg-gradient-to-t from-blue-600/20 to-purple-600/50 rounded-t-lg relative group">
                              <motion.div
                                initial={{ height: 0 }}
                                whileInView={{ height: `${h}%` }}
                                transition={{ duration: 1, delay: 0.1 * i }}
                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t-sm"
                              ></motion.div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>

                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Globe size={16} className="text-blue-400" />
                            <span className="text-gray-300 text-sm font-mono">deals.acme-corp.com/black-friday</span>
                          </div>
                          <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                            <TrendingUp size={12} /> +124%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to grow</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Powerful features packaged in a beautiful interface. Designed for speed, security, and scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
            {/* Main Feature - Analytics */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Deep Analytics</h3>
                <p className="text-blue-100 max-w-md">
                  Track clicks, geolocation, devices, and referrers in real-time.
                  Visualize your data with beautiful interactive charts.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-48 bg-white/5 rounded-tl-3xl translate-x-10 translate-y-10 group-hover:translate-x-5 group-hover:translate-y-5 transition-transform duration-500"></div>
            </motion.div>

            {/* Custom Domains */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                <Globe />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Domains</h3>
              <p className="text-gray-500 text-sm">
                Connect your own domain to build brand trust and improve click-through rates.
              </p>
            </motion.div>

            {/* QR Codes */}
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600">
                <QrCode />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart QR Codes</h3>
              <p className="text-gray-500 text-sm">
                Generate dynamic QR codes for any link. Customize colors, logos, and frames.
              </p>
            </motion.div>

            {/* File Sharing */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-xl flex items-center justify-center mb-6">
                    <FileImage className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">File-to-Link Sharing</h3>
                  <p className="text-gray-400 max-w-sm">
                    Upload PDFs, images, or documents and instantly get a secure, shareable short link.
                  </p>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-400/20 flex items-center justify-center text-red-400"><FileImage size={16} /></div>
                    <div className="text-sm">
                      <div className="font-medium text-white">presentation_v2.pdf</div>
                      <div className="text-xs text-gray-400">2.4 MB</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-black/40 rounded text-xs text-blue-300 font-mono">
                    <Check size={12} /> tinyslash.com/f/9xK2m
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works / Steps */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Designed for your workflow</h2>
              <p className="text-lg text-gray-500 mb-8">
                We've streamlined every step of the process so you can focus on sharing and growing.
              </p>

              <div className="space-y-8">
                {[
                  { icon: <LinkIcon />, title: "Paste & Shorten", desc: "Just paste your long URL. We handle the rest instantly." },
                  { icon: <TrendingUp />, title: "Share & Track", desc: "Share your link and watch the data roll in real-time." },
                  { icon: <Layers />, title: "Manage & Scale", desc: "Organize links with tags, workspaces, and team roles." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute top-10 right-10 w-72 h-72 bg-purple-300 rounded-full blur-[80px] opacity-20"></div>
              <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-300 rounded-full blur-[80px] opacity-20"></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100"
              >
                {/* Mock UI for Dashboard Card */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-gray-500">Total Clicks</div>
                    <div className="text-3xl font-bold text-gray-900">24,592</div>
                  </div>
                  <div className="bg-green-50 text-green-600 px-2 py-1 rounded text-sm font-medium">+12.5%</div>
                </div>
                <div className="space-y-3">
                  {[75, 40, 60, 85, 55, 70, 45].map((h, i) => (
                    <div key={i} className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${h}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between text-sm text-gray-400">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Infinite Scroll */}
      <section id="testimonials" className="py-24 bg-white border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Loved by thousands of users</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
            Join 50,000+ marketers, creators, and developers who trust TinySlash.
          </p>
        </div>

        <div className="relative flex overflow-hidden group">
          <div className="flex animate-marquee gap-8 py-4 items-stretch whitespace-nowrap">
            {[...Array(2)].map((_, setIndex) => (
              <React.Fragment key={setIndex}>
                {[
                  {
                    quote: "TinySlash has completely changed how we track our marketing campaigns. The analytics are superb.",
                    author: "Ravi Kumar",
                    role: "Digital Marketer, Hyderabad"
                  },
                  {
                    quote: "The cleanest URL shortener I've used. No ads, just features. Best for my startup.",
                    author: "Anusha Reddy",
                    role: "Tech Lead, Bangalore"
                  },
                  {
                    quote: "Custom domains and QR codes saved us so much time. Highly recommend for local businesses.",
                    author: "Karthik Raju",
                    role: "Business Owner, Vijayawada"
                  },
                  {
                    quote: "File sharing feature is something I didn't know I needed. Great for sharing documents.",
                    author: "Manoj Krishna",
                    role: "Consultant, Visakhapatnam"
                  },
                  {
                    quote: "Analytics are real-time and incredibly detailed. Helps in understanding customer behavior.",
                    author: "Swathi Chaudhry",
                    role: "Growth Manager, Chennai"
                  }
                ].map((t, i) => (
                  <div
                    key={`${setIndex}-${i}`}
                    className="w-[400px] flex-shrink-0 p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 mx-4 whitespace-normal"
                  >
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-gray-700 mb-8 font-medium text-lg leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <UserCircle size={32} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900">{t.author}</div>
                        <div className="text-sm text-gray-500 font-medium">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Gradient Masks */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-500">
              Have questions? We're here to help.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is there a free plan available?",
                a: "Yes! Our Free forever plan includes 500 active links, basic analytics, and unlimited clicks. It's perfect for individuals and hobbyists getting started."
              },
              {
                q: "How does the custom domain feature work?",
                a: "With our Pro and Business plans, you can connect your own domain (e.g., link.yourbrand.com) instead of using tinyslash.com. This builds trust and increases click-through rates by up to 34%."
              },
              {
                q: "Can I change the destination of a short link?",
                a: "Absolutely. All links created on TinySlash are dynamic. You can update the destination URL at any time from your dashboard without changing the short link itself."
              },
              {
                q: "Are the QR codes static or dynamic?",
                a: "All QR codes generated on TinySlash are dynamic. This means you can track scans, change the destination URL, and customize the design even after printing them."
              },
              {
                q: "What kind of analytics do I get?",
                a: "Our advanced analytics dashboard provides real-time data on clicks/scans, geographic location (country/city), referring sites, device types, and browsers. You can export this data for deeper analysis."
              },
              {
                q: "Is my data secure?",
                a: "Security is our top priority. We use enterprise-grade encryption for all data, offer 2FA for accounts, and ensure 99.9% uptime for your links. We are fully GDPR and CCPA compliant."
              }
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-[128px]"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your links?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join the link management platform that puts you in control.
            Start for free, scale when you need to.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl"
            >
              Get Started for Free
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 rounded-full text-lg font-bold text-white border border-white/20 hover:bg-white/10 transition-colors"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

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