import React, { useState } from 'react';
import { Link, QrCode, Upload, Crown, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface LandingPageShortenerProps {
  onSignupPrompt: () => void;
}

const LandingPageShortener: React.FC<LandingPageShortenerProps> = ({ onSignupPrompt }) => {
  const [activeTab, setActiveTab] = useState<'url' | 'qr' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [qrText, setQrText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (activeTab === 'url' && !urlInput.trim()) {
      toast.error('Please enter a URL to shorten');
      return;
    }
    if (activeTab === 'qr' && !qrText.trim()) {
      toast.error('Please enter text for QR code');
      return;
    }
    if (activeTab === 'file') {
      onSignupPrompt();
      return;
    }

    setIsLoading(true);

    // Simulate processing
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Ready to create! Please sign up to continue.');
      onSignupPrompt();
    }, 1000);
  };



  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Start Creating Links & QR Codes
        </h3>
        <p className="text-gray-600 text-lg">
          Enter your content below and we'll get you started with a free account
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'url'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>URL Shortener</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'qr'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
              activeTab === 'file'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>File to Link</span>
            <Crown className="w-3 h-3 text-yellow-500" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {activeTab === 'url' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Shorten Your URL</h4>
              <p className="text-gray-600">Transform long URLs into short, shareable links with analytics</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="url"
                placeholder="https://example.com/your-very-long-url-here..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Custom short links</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Click analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  <span>QR code included</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Generate QR Code</h4>
              <p className="text-gray-600">Create scannable QR codes for any text, URL, or content</p>
            </div>
            
            <div className="space-y-4">
              <textarea
                placeholder="Enter text, URL, contact info, or any content for your QR code..."
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                rows={3}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Customizable design</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  <span>High resolution</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Multiple formats</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">File to Link</h4>
              <p className="text-gray-600">Upload files and get shareable links instantly</p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors bg-gray-50">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h5 className="text-lg font-semibold text-gray-900 mb-2">Upload Any File</h5>
              <p className="text-gray-600 mb-6">
                Images, PDFs, documents, videos - we support all file types
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Secure cloud storage</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Password protection</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Download analytics</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Expiration dates</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                File upload requires a free account for security and storage management
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handleCreate}
            disabled={isLoading || 
              (activeTab === 'url' && !urlInput.trim()) || 
              (activeTab === 'qr' && !qrText.trim())
            }
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center space-x-3 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {activeTab === 'url' && 'Create Short Link'}
                  {activeTab === 'qr' && 'Generate QR Code'}
                  {activeTab === 'file' && 'Upload File'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Free account • No credit card required • Start in 30 seconds
          </p>
        </div>

        {/* Features Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mt-8">
          <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            What you'll get with your free account:
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Link className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Unlimited Links</p>
              <p className="text-xs text-gray-600">No limits on creation</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">QR Codes</p>
              <p className="text-xs text-gray-600">Auto-generated</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">File Sharing</p>
              <p className="text-xs text-gray-600">Up to 100MB</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Analytics</p>
              <p className="text-xs text-gray-600">Basic tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageShortener;