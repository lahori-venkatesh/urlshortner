import React from 'react';
import { Link } from 'react-router-dom';
import { Link as LinkIcon } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <img 
                  src={`${process.env.PUBLIC_URL}/round-logo-ts.png`}
                  alt="Pebly Logo" 
                  className="w-12 h-12 rounded-full"
                />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-white">Tiny</span>
                <span className="text-[#36a1ce]">Slash</span>
              </span>
            </div>
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              The smartest URL shortener for modern businesses. Create, manage, and track your links with powerful analytics.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <span className="text-blue-400 mr-3">✉</span>
                <span className="text-white font-medium">hello@tinyslash.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <span className="text-blue-400 mr-3">📞</span>
                <span className="text-white font-medium">+91 91829 28956</span>
              </div>
              <div className="flex items-center text-gray-300">
                <span className="text-blue-400 mr-3">📍</span>
                <span className="text-white font-medium">Jaipur, Rajasthan</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/pricing" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@tinyslash.com" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Legal & Policies</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  to="/cancellation-refund" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/shipping-policy" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-lg font-medium block"
                >
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-lg mb-4 md:mb-0">
              © 2025 <span className="text-white font-semibold">TinySlash</span>. All rights reserved.
            </p>
            <div className="flex space-x-8">
              <Link 
                to="/privacy" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium text-lg"
              >
                Privacy
              </Link>
              <Link 
                to="/terms" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium text-lg"
              >
                Terms
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium text-lg"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;