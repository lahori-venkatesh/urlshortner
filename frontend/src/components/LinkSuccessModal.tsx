import React from 'react';
import { X, Copy, ExternalLink, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface LinkSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  originalUrl: string;
  qrCode?: string;
  type: 'url' | 'qr' | 'file';
}

const LinkSuccessModal: React.FC<LinkSuccessModalProps> = ({
  isOpen,
  onClose,
  shortUrl,
  originalUrl,
  qrCode,
  type
}) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const openLink = () => {
    window.open(shortUrl, '_blank');
  };

  const viewDetails = () => {
    // Navigate to analytics page
    const shortCode = shortUrl.split('/').pop();
    window.open(`/analytics/${shortCode}`, '_blank');
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out this ${type === 'file' ? 'file' : 'link'}: ${shortUrl}`;
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shortUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(shortUrl)}&title=${encodeURIComponent(text)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'url':
        return 'Your link is ready! 🎉';
      case 'qr':
        return 'Your QR code is ready! 🎉';
      case 'file':
        return 'Your file link is ready! 🎉';
      default:
        return 'Your link is ready! 🎉';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getTitle()}
              </h2>
              <p className="text-gray-600">
                Copy the link below to share it or choose a platform to share it to.
              </p>
            </div>

            {/* Short URL Display */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-4 break-all">
                  {shortUrl}
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={viewDetails}
                    className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>View link details</span>
                  </button>
                  
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code Display */}
            {qrCode && (
              <div className="text-center mb-6">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-32 h-32 mx-auto border rounded-lg"
                />
              </div>
            )}

            {/* Social Share Options */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xs font-bold">W</span>
                </div>
                <span className="text-xs text-gray-600">WhatsApp</span>
              </button>

              <button
                onClick={() => shareToSocial('telegram')}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-xs text-gray-600">Telegram</span>
              </button>

              <button
                onClick={() => shareToSocial('twitter')}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xs font-bold">X</span>
                </div>
                <span className="text-xs text-gray-600">Twitter</span>
              </button>

              <button
                onClick={() => shareToSocial('linkedin')}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xs font-bold">in</span>
                </div>
                <span className="text-xs text-gray-600">LinkedIn</span>
              </button>

              <button
                onClick={() => shareToSocial('facebook')}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <span className="text-xs text-gray-600">Facebook</span>
              </button>

              <button
                onClick={() => shareToSocial('reddit')}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-xs font-bold">R</span>
                </div>
                <span className="text-xs text-gray-600">Reddit</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LinkSuccessModal;