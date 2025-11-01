import React, { useState, useEffect } from 'react';
import { Link, QrCode, Upload, Copy, ExternalLink, Settings, Calendar, Lock, Eye, EyeOff, Zap, Sparkles, Shield, Globe, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useUpgradeModal } from '../context/ModalContext';
import QRCodeGenerator from './QRCodeGenerator';
import { aiService, AliasSuggestion, SecurityCheck } from '../services/aiService';
import toast from 'react-hot-toast';
import { uploadFileToBackend, createShortUrl, createQrCode, getUserUrls, getUserFiles, getUserQrCodes } from '../services/api';
import SimpleFileUpload from './SimpleFileUpload';
import UpgradeModal from './UpgradeModal';


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
  
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const featureAccess = useFeatureAccess(user);
  const upgradeModal = useUpgradeModal();
  const [activeTab, setActiveTab] = useState<'url' | 'qr' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [qrText, setQrText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('pebly.vercel.app');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState<number | ''>('');
  const [maxClicks, setMaxClicks] = useState<number | ''>('');
  const [isOneTime, setIsOneTime] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedLinks, setShortenedLinks] = useState<ShortenedLink[]>([]);
  
  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase();
  }, [user]);

  const loadDataFromDatabase = async () => {
    if (!user || !user.id) {
      return;
    }

    try {
      // Load URLs, files, and QR codes from database
      const [urlsResponse, filesResponse, qrResponse] = await Promise.all([
        getUserUrls(user.id).catch(e => ({ success: false, data: [] })),
        getUserFiles(user.id).catch(e => ({ success: false, data: [] })),
        getUserQrCodes(user.id).catch(e => ({ success: false, data: [] }))
      ]);

      const allLinks: ShortenedLink[] = [];

      // Add URLs
      if (urlsResponse.success) {
        urlsResponse.data.forEach((url: any) => {
          allLinks.push({
            id: url.id,
            shortCode: url.shortCode,
            shortUrl: url.shortUrl,
            originalUrl: url.originalUrl,
            clicks: url.totalClicks || 0,
            createdAt: url.createdAt,
            type: 'url'
          });
        });
      }

      // Add Files
      if (filesResponse.success) {
        filesResponse.data.forEach((file: any) => {
          allLinks.push({
            id: file.id,
            shortCode: file.fileCode,
            shortUrl: file.fileUrl,
            originalUrl: file.fileUrl,
            clicks: file.totalDownloads || 0,
            createdAt: file.uploadedAt,
            type: 'file'
          });
        });
      }

      // Add QR Codes
      if (qrResponse.success) {
        qrResponse.data.forEach((qr: any) => {
          allLinks.push({
            id: qr.id,
            shortCode: qr.qrCode,
            shortUrl: qr.qrImageUrl,
            originalUrl: qr.content,
            clicks: qr.totalScans || 0,
            createdAt: qr.createdAt,
            type: 'qr',
            qrCode: qr.qrImagePath
          });
        });
      }

      // Sort by creation date (newest first)
      allLinks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setShortenedLinks(allLinks);

    } catch (error) {
      console.error('Failed to load data from database:', error);
      toast.error('Failed to load your data from database');
    }
  };
  
  // AI Features
  const [aiSuggestions, setAiSuggestions] = useState<AliasSuggestion[]>([]);
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [customDomains, setCustomDomains] = useState<string[]>(['pebly.vercel.app']);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);

  // Load custom domains from backend API
  React.useEffect(() => {
    const loadCustomDomains = async () => {
      if (!user || !token) return;

      try {
        setIsLoadingDomains(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        
        const response = await fetch(`${apiUrl}/api/v1/domains/verified`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.domains) {
            const domainNames = data.domains.map((domain: any) => domain.domainName);
            // Always include the default domain
            const allDomains = ['pebly.vercel.app', ...domainNames];
            setCustomDomains(Array.from(new Set(allDomains))); // Remove duplicates
          }
        }
      } catch (error) {
        console.error('Failed to load custom domains:', error);
        // Keep default domain on error
        setCustomDomains(['pebly.vercel.app']);
      } finally {
        setIsLoadingDomains(false);
      }
    };

    loadCustomDomains();
  }, [user]);

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
    // Basic validation
    if (activeTab === 'url' && !urlInput.trim()) {
      toast.error('Please enter a URL to shorten');
      return;
    }
    if (activeTab === 'qr' && !qrText.trim()) {
      toast.error('Please enter text or URL for QR code');
      return;
    }
    if (activeTab === 'file') {
      window.location.href = '/dashboard?section=file-to-url';
      return;
    }

    // Check premium features BEFORE processing
    const blockedFeatures: string[] = [];
    
    if (customAlias.trim() && !featureAccess.canUseCustomAlias) {
      blockedFeatures.push('Custom Alias');
    }
    if (password.trim() && !featureAccess.canUsePasswordProtection) {
      blockedFeatures.push('Password Protection');
    }
    if (expirationDays && !featureAccess.canUseLinkExpiration) {
      blockedFeatures.push('Link Expiration');
    }
    if (maxClicks && !featureAccess.canUseClickLimits) {
      blockedFeatures.push('Click Limits');
    }
    if (selectedDomain !== 'pebly.vercel.app' && !featureAccess.canUseCustomDomain) {
      blockedFeatures.push('Custom Domains');
    }
    
    if (blockedFeatures.length > 0) {
      const featureText = blockedFeatures.length === 1 
        ? blockedFeatures[0] 
        : blockedFeatures.slice(0, -1).join(', ') + ' and ' + blockedFeatures.slice(-1);
      
      const message = `${featureText} ${blockedFeatures.length === 1 ? 'requires' : 'require'} a Pro subscription. Upgrade to unlock ${blockedFeatures.length === 1 ? 'this feature' : 'these features'}.`;
      
      upgradeModal.open(
        'Premium Features Required',
        message,
        false
      );
      
      return; // Stop processing
    }

    setIsLoading(true);

    try {
      const userId = user?.id || 'anonymous-user';
      let result;
      let newLink: ShortenedLink | null = null;

      if (activeTab === 'url') {
        console.log('Creating short URL...');
        result = await createShortUrl({
          originalUrl: urlInput,
          userId,
          customAlias: customAlias || undefined,
          password: password || undefined,
          expirationDays: expirationDays ? parseInt(expirationDays.toString()) : undefined,
          title: `Short link for ${urlInput}`,
          description: 'Created via URL Shortener',
          customDomain: selectedDomain !== 'pebly.vercel.app' ? selectedDomain : undefined
        });

        if (result.success) {
          newLink = {
            id: result.data.id,
            shortCode: result.data.shortCode,
            shortUrl: result.data.shortUrl,
            originalUrl: result.data.originalUrl,
            clicks: 0,
            createdAt: result.data.createdAt,
            type: 'url'
          };
          toast.success('URL shortened successfully!');
        } else {
          throw new Error(result.message || 'Failed to create short URL');
        }

      } else if (activeTab === 'qr') {
        console.log('Creating QR code...');
        result = await createQrCode({
          content: qrText,
          contentType: 'TEXT',
          userId,
          title: `QR Code for ${qrText}`,
          description: 'Created via QR Generator'
        });

        if (result.success) {
          newLink = {
            id: result.data.id,
            shortCode: result.data.qrCode,
            shortUrl: result.data.qrImageUrl,
            originalUrl: result.data.content,
            clicks: 0,
            createdAt: result.data.createdAt,
            type: 'qr',
            qrCode: result.data.qrImagePath
          };
          toast.success('QR Code created successfully!');
        } else {
          throw new Error(result.message || 'Failed to create QR code');
        }
      }

      // Add to local state
      if (newLink) {
        setShortenedLinks(prev => [newLink!, ...prev]);
        
        // Reload from database for consistency
        if (user?.id) {
          loadDataFromDatabase();
        }
      }
      
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
      
    } catch (error) {
      console.error('Error in handleShorten:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request';
      toast.error(`Failed to create link: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
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
                <p className="font-semibold">Upgrade to Pro</p>
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
            <div className="text-center py-8">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                <Upload className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">File to Link Creation</h3>
                <p className="text-gray-600 mb-4">
                  Upload files and create shareable links with advanced features
                </p>
                <button
                  onClick={() => {
                    // Navigate to dashboard file section
                    window.location.href = '/dashboard?section=file-to-url';
                  }}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center space-x-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span>Go to File to Link</span>
                </button>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Domain
                    </label>
                    <div className="flex items-center space-x-2">
                      {user?.plan && (user.plan.includes('PRO') || user.plan.includes('BUSINESS')) && (
                        <button
                          onClick={() => navigate('/dashboard?tab=domains')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Manage Domains
                        </button>
                      )}
                    </div>
                  </div>
                  <select
                    value={selectedDomain}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      console.log('Domain dropdown changed:', selectedValue);
                      
                      if (selectedValue === 'ADD_CUSTOM_DOMAIN') {
                        e.preventDefault();
                        
                        // Reset dropdown to default
                        setSelectedDomain('pebly.vercel.app');
                        
                        // Check if user can use custom domains
                        if (!featureAccess.canUseCustomDomain) {
                          // Show upgrade modal for custom domains
                          upgradeModal.open(
                            'Custom Domains',
                            'Custom domains allow you to use your own branded short links. Upgrade to Pro to unlock this feature and build your brand.',
                            false
                          );
                        } else {
                          // User has access, navigate to domain management
                          navigate('/dashboard?tab=domains');
                        }
                        
                        return;
                      } else {
                        setSelectedDomain(selectedValue);
                      }
                    }}
                    disabled={isLoadingDomains}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    {isLoadingDomains ? (
                      <option>Loading domains...</option>
                    ) : (
                      <>
                        {/* Default and custom domains */}
                        {customDomains.map(domain => (
                          <option key={domain} value={domain}>
                            {domain} {domain === 'pebly.vercel.app' ? '(Default)' : ''}
                          </option>
                        ))}
                        
                        {/* Add Custom Domain option for all users */}
                        <option value="ADD_CUSTOM_DOMAIN" className="text-blue-600 font-medium">
                          + Add Custom Domain {!featureAccess.canUseCustomDomain ? '(Pro)' : ''}
                        </option>
                      </>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {featureAccess.canUseCustomDomain
                      ? 'Select a domain or add a new custom domain from the dropdown'
                      : 'Select "Add Custom Domain" to upgrade and use your own branded domains'
                    }
                  </p>
                  

                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Alias (Optional)
                    </label>
                    {!featureAccess.canUseCustomAlias && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Zap className="w-3 h-3 mr-1" />
                        Pro
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={featureAccess.canUseCustomAlias ? "my-custom-link" : "Upgrade to Pro for custom aliases"}
                    value={customAlias}
                    onChange={(e) => {
                      if (!featureAccess.canUseCustomAlias && e.target.value.trim()) {
                        upgradeModal.open(
                          'Custom Aliases',
                          'Create memorable custom short links with Pro. Make your links more brandable and easier to remember.',
                          false
                        );
                        return;
                      }
                      setCustomAlias(e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !featureAccess.canUseCustomAlias 
                        ? 'border-purple-200 bg-purple-50 placeholder-purple-400' 
                        : 'border-gray-300'
                    }`}
                  />
                  {customAlias && featureAccess.canUseCustomAlias && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preview: {selectedDomain}/{customAlias}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password Protection
                    </label>
                    {!featureAccess.canUsePasswordProtection && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={featureAccess.canUsePasswordProtection ? "Optional password" : "Upgrade to Pro for password protection"}
                      value={password}
                      onChange={(e) => {
                        if (!featureAccess.canUsePasswordProtection && e.target.value.trim()) {
                          upgradeModal.open(
                            'Password Protection',
                            'Secure your links with password protection. Only users with the password can access your content.',
                            false
                          );
                          return;
                        }
                        setPassword(e.target.value);
                      }}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !featureAccess.canUsePasswordProtection
                          ? 'border-purple-200 bg-purple-50 placeholder-purple-400'
                          : 'border-gray-300'
                      }`}
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Expiration (Days)
                    </label>
                    {!featureAccess.canUseLinkExpiration && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Calendar className="w-3 h-3 mr-1" />
                        Pro
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder={featureAccess.canUseLinkExpiration ? "Never expires" : "Upgrade to Pro for link expiration"}
                    value={expirationDays}
                    onChange={(e) => {
                      if (!featureAccess.canUseLinkExpiration && e.target.value.trim()) {
                        upgradeModal.open(
                          'Link Expiration',
                          'Set expiration dates for your links to automatically disable them after a certain time period.',
                          false
                        );
                        return;
                      }
                      setExpirationDays(e.target.value ? parseInt(e.target.value) : '');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !featureAccess.canUseLinkExpiration
                        ? 'border-purple-200 bg-purple-50 placeholder-purple-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Max Clicks
                    </label>
                    {!featureAccess.canUseClickLimits && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Pro
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder={featureAccess.canUseClickLimits ? "Unlimited" : "Upgrade to Pro for click limits"}
                    value={maxClicks}
                    onChange={(e) => {
                      if (!featureAccess.canUseClickLimits && e.target.value.trim()) {
                        upgradeModal.open(
                          'Click Limits',
                          'Control the maximum number of clicks your links can receive before they become inactive.',
                          false
                        );
                        return;
                      }
                      setMaxClicks(e.target.value ? parseInt(e.target.value) : '');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !featureAccess.canUseClickLimits
                        ? 'border-purple-200 bg-purple-50 placeholder-purple-400'
                        : 'border-gray-300'
                    }`}
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
            disabled={isLoading || (activeTab === 'url' && !urlInput.trim()) || (activeTab === 'qr' && !qrText.trim()) || (activeTab === 'file')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {activeTab === 'url' ? 'Shortening...' : activeTab === 'qr' ? 'Generating...' : 'Processing...'}
              </div>
            ) : (
              <>
                {activeTab === 'url' ? 'Shorten URL' : activeTab === 'qr' ? 'Generate QR Code' : 'Go to File Upload'}
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

      {/* Upgrade Modal is now mounted globally in App.tsx */}
    </div>
  );
};

export default UrlShortener;