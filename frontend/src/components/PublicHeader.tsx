import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AuthModal from './AuthModal';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
              onClick={() => {
                if (location.pathname !== '/') navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img src="/logo.png" alt="Tinyslash Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-gray-900">Tiny</span>
                <span className="text-[#36a1ce]">Slash</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">How it Works</button>
              <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Customers</button>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 px-4 py-2 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:text-gray-900">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <button onClick={() => scrollToSection('features')} className="block text-base font-medium text-gray-600 w-full text-left">Features</button>
                <button onClick={() => scrollToSection('how-it-works')} className="block text-base font-medium text-gray-600 w-full text-left">How it Works</button>
                <button onClick={() => { navigate('/pricing'); setIsMenuOpen(false); }} className="block text-base font-medium text-gray-600 w-full text-left">Pricing</button>
                <button onClick={() => scrollToSection('testimonials')} className="block text-base font-medium text-gray-600 w-full text-left">Customers</button>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <button
                    onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                    className="block w-full text-center py-2.5 text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                    className="block w-full text-center py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    Sign up free
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default PublicHeader;
