import React, { useState } from 'react';
import { Link, QrCode, Upload, Copy, ExternalLink, Settings, Calendar, Lock, Eye, EyeOff, Zap, Sparkles, Shield, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import QRCodeGenerator from './QRCodeGenerator';
import { aiService, AliasSuggestion, SecurityCheck } from '../services/aiService';

interface ShortenedLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  qrCode?: string;
  clicks: number;
  createdAt: string;
  customDomain?: string;
  type?: 'url' | 'qr' | 'file';
}

const UrlShortener: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'url' | 'qr' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('shlnk.pro');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | ''>('');
  const [maxClicks, setMaxClicks] = useState<number | ''>('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedLinks, setShortenedLinks] = useState<ShortenedLink[]>([]);
  
  // AI Features
  const [aiSuggestions, setAiSuggestions] = useState<AliasSuggestion[]>([]);
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [customDomains, setCustomDomains] = useState<string[]>(['shlnk.pro']);

  // Load existing links and custom domains from localStorage on component mount
  React.useEffect(() => {
    const storedLinks = localStorage.getItem('shortenedLinks');
    if (storedLinks) {
      try {
        const parsedLinks = JSON.parse(storedLinks);
        setShortenedLinks(parsedLinks);
      } catch (err) {
        console.error('Failed to parse stored links:', err);
      }
    }

    // Load custom domains
    const storedDomains = localStorage.getItem('customDomains');
    if (storedDomains) {
      try {
        const parsedDomains = JSON.parse(storedDomains);
        const activeDomains = parsedDomains
          .filter((d: any) => d.status === 'active')
          .map((d: any) => d.domain);
        setCustomDomains(['shlnk.pro', ...activeDomains]);
      } catch (err) {
        console.error('Failed to parse custom domains:', err);
      }
    }
  }, []);

  // AI-powered URL analysis
  React.useEffect(() => {
    const analyzeURL = async () => {
      const currentUrl = activeTab === 'url' ? urlInput : activeTab === 'qr' ? qrText : '';
      
      if (!currentUrl.trim() || !currentUrl.startsWith('http')) return;

      setIsLoadingAI(true);
      
      try {
        const [suggestions, security] = await Promise.all([
          aiService.generateAliasSuggestions(currentUrl),
          aiService.checkURLSecurity(currentUrl)
        ]);
        
        setAiSuggestions(suggestions);
        setSecurityCheck(security);
      } catch (error) {
        console.error('AI analysis failed:', error);
      } finally {
        setIsLoadingAI(false);
      }
    };

    const timer = setTimeout(analyzeURL, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [urlInput, qrText, activeTab]);

  const handleShorten = async () => {
    if (activeTab === 'url' && !urlInput.trim()) return;
    if (activeTab === 'qr' && !qrText.trim()) return;
    if (activeTab === 'file' && !selectedFile) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const shortCode = customAlias || Math.random().toString(36).substr(2, 6);
      const baseUrl = window.location.origin; // This will be http://localhost:3000 in development
      let originalUrl = '';
      if (activeTab === 'url') {
        originalUrl = urlInput;
      } else if (activeTab === 'qr') {
        originalUrl = qrText;
      } else if (activeTab === 'file' && selectedFile) {
        // For file uploads, we'll use a placeholder URL since we don't have a real file server
        originalUrl = `https://example.com/files/${selectedFile.name}`;
      }

      const finalDomain = selectedDomain === 'shlnk.pro' ? baseUrl : `https://${selectedDomain}`;
      
      const newLink: ShortenedLink = {
        id: Date.now().toString(),
        shortCode,
        shortUrl: `${finalDomain}/${shortCode}`,
        originalUrl,
        clicks: 0,
        createdAt: new Date().toISOString(),
        customDomain: selectedDomain !== 'shlnk.pro' ? selectedDomain : undefined,
        type: activeTab
      };

      console.log('Creating new link:', newLink);

      setShortenedLinks(prev => {
        const updatedLinks = [newLink, ...prev];
        // Store in localStorage for redirect functionality
        localStorage.setItem('shortenedLinks', JSON.stringify(updatedLinks));
        return updatedLinks;
      });
      setIsLoading(false);
      
      // Reset form
      setUrlInput('');
      setQrText('');
      setSelectedFile(null);
      setCustomAlias('');
      setPassword('');
      setExpirationDays('');
      setMaxClicks('');
      setIsOneTime(false);
      setAiSuggestions([]);
      setSecurityCheck(null);
    }, 1500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Import toast dynamically to avoid issues
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Free User Ad Banner */}
      {user?.plan === 'free' && (
        <motion.div 
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5" />
              <div>
                <p className="font-semibold">Upgrade to Premium</p>
                <p className="text-sm opacity-90">Remove ads, get advanced analytics, and unlock all features</p>
              </div>
            </div>
            <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Upgrade Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Shortener Card */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Short Links</h2>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'url'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" />
              URL Shortener
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'qr'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              File to Link
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter URL to shorten
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://example.com/very-long-url..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isLoadingAI && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter text or URL for QR code
              </label>
              <input
                type="text"
                placeholder="Enter text, URL, or any content..."
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {activeTab === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload file to create shareable link
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  PDF, Images, Documents (Max 10MB)
                </p>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                AI-Suggested Aliases
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setCustomAlias(suggestion.alias)}
                    className="px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-50 transition-colors text-left"
                    title={suggestion.reason}
                  >
                    <div className="font-medium">{suggestion.alias}</div>
                    <div className="text-xs text-gray-500 capitalize">{suggestion.category}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security Check */}
          {securityCheck && (
            <div className={`p-4 rounded-lg border ${
              securityCheck.isSpam || securityCheck.riskScore > 50
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center">
                <Shield className={`w-5 h-5 mr-2 ${
                  securityCheck.isSpam || securityCheck.riskScore > 50
                    ? 'text-red-600'
                    : 'text-green-600'
                }`} />
                <span className="font-medium">
                  {securityCheck.isSpam || securityCheck.riskScore > 50
                    ? 'Security Risk Detected'
                    : 'URL is Safe'
                  }
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  (Risk Score: {securityCheck.riskScore}%)
                </span>
              </div>
              {securityCheck.reasons.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600">
                  {securityCheck.reasons.map((reason, index) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Advanced Settings */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <Settings className="w-4 h-4 mr-2" />
              Advanced Settings
              <span className="ml-2">{showAdvanced ? '−' : '+'}</span>
            </button>

            {showAdvanced && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain
                  </label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {customDomains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Alias (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="my-custom-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {customAlias && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preview: {selectedDomain}/{customAlias}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Protection
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Optional password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration (Days)
                  </label>
                  <input
                    type="number"
                    placeholder="Never expires"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Clicks
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isOneTime}
                      onChange={(e) => setIsOneTime(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">One-time use link (self-destruct after first click)</span>
                  </label>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleShorten}
            disabled={isLoading || (activeTab === 'url' && !urlInput.trim()) || (activeTab === 'qr' && !qrText.trim()) || (activeTab === 'file' && !selectedFile)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {activeTab === 'url' ? 'Shortening...' : activeTab === 'qr' ? 'Generating...' : 'Uploading...'}
              </div>
            ) : (
              <>
                {activeTab === 'url' ? 'Shorten URL' : activeTab === 'qr' ? 'Generate QR Code' : 'Upload & Create Link'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {shortenedLinks.length > 0 && (
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Links</h3>
          <div className="space-y-4">
            {shortenedLinks.map((link) => (
              <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Original: {link.originalUrl}</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-blue-600 font-mono">{link.shortUrl}</code>
                      <button
                        onClick={() => copyToClipboard(link.shortUrl)}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(link.shortUrl, '_blank')}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{link.clicks} clicks</p>
                    <p className="text-xs text-gray-400">{new Date(link.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {activeTab === 'qr' && (
                  <div className="mt-3 flex justify-center">
                    <QRCodeGenerator value={link.shortUrl} size={128} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UrlShortener;